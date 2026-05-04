import { db } from '../../db/connection'
import { generateId } from '../../shared/id'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Normalise two user IDs into the ordered (a < b) pair stored in `connections`. */
function orderedPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x]
}

// ── Send request ───────────────────────────────────────────────────────────

export async function sendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) {
    return { error: 'SELF_REQUEST' as const }
  }

  // Already connected?
  const [a, b] = orderedPair(senderId, receiverId)
  const existing = await db
    .selectFrom('connections')
    .selectAll()
    .where('user_id_a', '=', a)
    .where('user_id_b', '=', b)
    .executeTakeFirst()

  if (existing) return { error: 'ALREADY_CONNECTED' as const }

  // Duplicate pending request in same direction?
  const duplicate = await db
    .selectFrom('connection_requests')
    .selectAll()
    .where('sender_id', '=', senderId)
    .where('receiver_id', '=', receiverId)
    .where('status', '=', 'pending')
    .executeTakeFirst()

  if (duplicate) return { error: 'DUPLICATE_REQUEST' as const }

  // Reverse pending request exists → auto-accept both sides.
  const reverse = await db
    .selectFrom('connection_requests')
    .selectAll()
    .where('sender_id', '=', receiverId)
    .where('receiver_id', '=', senderId)
    .where('status', '=', 'pending')
    .executeTakeFirst()

  if (reverse) {
    const now = new Date().toISOString()

    // Mark the reverse request accepted.
    await db
      .updateTable('connection_requests')
      .set({ status: 'accepted', updated_at: now })
      .where('request_id', '=', reverse.request_id)
      .execute()

    // Create the canonical connection row.
    const connection = await db
      .insertInto('connections')
      .values({ connection_id: generateId(), user_id_a: a, user_id_b: b })
      .returningAll()
      .executeTakeFirstOrThrow()

    return { auto_accepted: true, connection }
  }

  // Normal case: insert a new pending request.
  const request = await db
    .insertInto('connection_requests')
    .values({
      request_id:  generateId(),
      sender_id:   senderId,
      receiver_id: receiverId,
      status:      'pending',
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { auto_accepted: false, request }
}

// ── Accept ─────────────────────────────────────────────────────────────────

export async function acceptRequest(requestId: string, actingUserId: string) {
  const req = await db
    .selectFrom('connection_requests')
    .selectAll()
    .where('request_id', '=', requestId)
    .executeTakeFirst()

  if (!req) return { error: 'NOT_FOUND' as const }
  if (req.receiver_id !== actingUserId) return { error: 'FORBIDDEN' as const }
  if (req.status !== 'pending') return { error: 'NOT_PENDING' as const }

  const now = new Date().toISOString()
  const [a, b] = orderedPair(req.sender_id, req.receiver_id)

  await db
    .updateTable('connection_requests')
    .set({ status: 'accepted', updated_at: now })
    .where('request_id', '=', requestId)
    .execute()

  const connection = await db
    .insertInto('connections')
    .values({ connection_id: generateId(), user_id_a: a, user_id_b: b })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { connection }
}

// ── Reject ─────────────────────────────────────────────────────────────────

export async function rejectRequest(requestId: string, actingUserId: string) {
  const req = await db
    .selectFrom('connection_requests')
    .selectAll()
    .where('request_id', '=', requestId)
    .executeTakeFirst()

  if (!req) return { error: 'NOT_FOUND' as const }
  if (req.receiver_id !== actingUserId) return { error: 'FORBIDDEN' as const }
  if (req.status !== 'pending') return { error: 'NOT_PENDING' as const }

  await db
    .updateTable('connection_requests')
    .set({ status: 'rejected', updated_at: new Date().toISOString() })
    .where('request_id', '=', requestId)
    .execute()

  return { success: true }
}

// ── Cancel (sender withdraws) ──────────────────────────────────────────────

export async function cancelRequest(requestId: string, actingUserId: string) {
  const req = await db
    .selectFrom('connection_requests')
    .selectAll()
    .where('request_id', '=', requestId)
    .executeTakeFirst()

  if (!req) return { error: 'NOT_FOUND' as const }
  if (req.sender_id !== actingUserId) return { error: 'FORBIDDEN' as const }
  if (req.status !== 'pending') return { error: 'NOT_PENDING' as const }

  await db
    .updateTable('connection_requests')
    .set({ status: 'cancelled', updated_at: new Date().toISOString() })
    .where('request_id', '=', requestId)
    .execute()

  return { success: true }
}

// ── Queries ────────────────────────────────────────────────────────────────

/** All accepted connections for a user (either side of the pair). */
export async function getConnections(userId: string) {
  return db
    .selectFrom('connections')
    .selectAll()
    .where(eb => eb.or([
      eb('user_id_a', '=', userId),
      eb('user_id_b', '=', userId),
    ]))
    .orderBy('created_at', 'desc')
    .execute()
}

// ── Suggestions ───────────────────────────────────────────────────────────

const LEVEL_PRIORITY: Record<string, number> = {
  international: 4,
  national: 3,
  state: 2,
  district: 1,
}

export async function getSuggestions(athleteId: string) {
  // 1. Get the current athlete's profile
  const athlete = await db
    .selectFrom('athlete_profiles')
    .selectAll()
    .where('athlete_id', '=', athleteId)
    .executeTakeFirst()

  if (!athlete) return { error: 'NOT_FOUND' as const }

  // 2. Get the athlete's sport_ids from sports_passport
  const mySports = await db
    .selectFrom('sports_passport')
    .select('sport_id')
    .where('athlete_id', '=', athleteId)
    .execute()

  const mySportIds = new Set(mySports.map(s => s.sport_id))

  // 3. Get all other athlete profiles (exclude self)
  const allAthletes = await db
    .selectFrom('athlete_profiles')
    .selectAll()
    .where('athlete_id', '!=', athleteId)
    .execute()

  // 4. Get already-connected user_ids to exclude
  const myConnections = await db
    .selectFrom('connections')
    .selectAll()
    .where(eb => eb.or([
      eb('user_id_a', '=', athlete.user_id),
      eb('user_id_b', '=', athlete.user_id),
    ]))
    .execute()

  const connectedUserIds = new Set(
    myConnections.flatMap(c =>
      c.user_id_a === athlete.user_id ? [c.user_id_b] : [c.user_id_a]
    )
  )

  // 5. Get sports played by all other athletes
  const otherAthleteIds = allAthletes.map(a => a.athlete_id)
  const otherPassports = otherAthleteIds.length > 0
    ? await db
        .selectFrom('sports_passport')
        .select(['athlete_id', 'sport_id', 'tournament_id', 'level_override'])
        .where('athlete_id', 'in', otherAthleteIds)
        .execute()
    : []

  // Get tournament levels for entries with tournament_id
  const tournamentIds = otherPassports
    .map(p => p.tournament_id)
    .filter((t): t is string => t !== null)

  const tournaments = tournamentIds.length > 0
    ? await db.selectFrom('tournaments').select(['tournament_id', 'level'])
        .where('tournament_id', 'in', tournamentIds).execute()
    : []

  const tLevelMap = new Map(tournaments.map(t => [t.tournament_id, t.level]))

  // Build per-athlete sport sets and highest level
  const athleteSports = new Map<string, Set<string>>()
  const athleteLevel = new Map<string, string>()

  for (const p of otherPassports) {
    // Sports
    if (!athleteSports.has(p.athlete_id)) athleteSports.set(p.athlete_id, new Set())
    athleteSports.get(p.athlete_id)!.add(p.sport_id)

    // Level — track the highest
    const level = p.level_override ?? (p.tournament_id ? tLevelMap.get(p.tournament_id) ?? null : null)
    if (level) {
      const current = athleteLevel.get(p.athlete_id)
      if (!current || (LEVEL_PRIORITY[level] ?? 0) > (LEVEL_PRIORITY[current] ?? 0)) {
        athleteLevel.set(p.athlete_id, level)
      }
    }
  }

  // 6. Score and filter
  type Scored = { athlete_id: string; name: string; profile_pic: string | null; level: string | null; location: string; score: number }
  const scored: Scored[] = []

  for (const a of allAthletes) {
    // Skip already-connected users
    if (connectedUserIds.has(a.user_id)) continue

    let score = 0

    // Similar sports
    const theirSports = athleteSports.get(a.athlete_id)
    if (theirSports) {
      for (const sid of theirSports) {
        if (mySportIds.has(sid)) score += 2
      }
    }

    // Same city
    if (a.city && athlete.city && a.city.toLowerCase() === athlete.city.toLowerCase()) score += 1
    // Same state
    if (a.state && athlete.state && a.state.toLowerCase() === athlete.state.toLowerCase()) score += 1

    if (score === 0) continue

    const levelStr = athleteLevel.get(a.athlete_id) ?? null
    const location = [a.city, a.state].filter(Boolean).join(', ')

    scored.push({
      athlete_id: a.athlete_id,
      name: `${a.first_name} ${a.last_name}`,
      profile_pic: a.profile_photo_url,
      level: levelStr ? levelStr.charAt(0).toUpperCase() + levelStr.slice(1) : null,
      location,
      score,
    })
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Return without the internal score field
  return scored.map(({ score: _score, ...rest }) => rest)
}

/** Pending requests involving the user (sent or received). */
export async function getPendingRequests(userId: string) {
  const rows = await db
    .selectFrom('connection_requests')
    .selectAll()
    .where('status', '=', 'pending')
    .where(eb => eb.or([
      eb('sender_id',   '=', userId),
      eb('receiver_id', '=', userId),
    ]))
    .orderBy('created_at', 'desc')
    .execute()

  return {
    incoming: rows.filter(r => r.receiver_id === userId),
    outgoing: rows.filter(r => r.sender_id   === userId),
  }
}
