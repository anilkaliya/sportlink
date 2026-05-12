import { join } from 'path'
import { db } from '../../db/connection'
import { generateId } from '../../shared/id'

const UPLOADS_DIR = join(import.meta.dir, '../../../uploads/photos')
import type { UpdateableAthleteProfile } from '../../db/schema'
import type {
  CreateAthleteInput, UpdateAthleteInput,
  CreatePassportEntryInput, SkillInput, EducationInput,
} from './athlete.types'
import { incrementOnboardingStep, setOnboardingComplete } from '../users/user.service'

export async function getAllAthletes(currentUserId: string) {
  const excludedUserIds = new Set<string>([currentUserId])

  const rows = await db
    .selectFrom('athlete_profiles')
    .leftJoin('sports', 'sports.sport_id', 'athlete_profiles.primary_sport_id')
    .selectAll('athlete_profiles')
    .select('sports.sport_name')
    .where('athlete_profiles.user_id', 'not in', [...excludedUserIds])
    .orderBy('athlete_profiles.created_at', 'desc')
    .execute()

  return rows.map(r => ({
    ...r,
    full_name: `${r.first_name} ${r.last_name}`,
  }))
}

export async function createAthlete(data: CreateAthleteInput) {
  const profile = await db.insertInto('athlete_profiles')
    .values({
      athlete_id: generateId(),
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
      primary_sport_id: data.primary_sport_id,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      city: data.city,
      state: data.state,
      country: data.country,
      bio: data.bio ?? null,
      profile_photo_url: data.profile_photo_url ?? null,
      languages: data.languages ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const onboarding_step = await incrementOnboardingStep(data.user_id)
  return { ...profile, onboarding_step, onboarding_complete: onboarding_step === 3 }
}

export async function getAthleteById(id: string) {
  const profile = await db
    .selectFrom('athlete_profiles')
    .selectAll()
    .where('athlete_id', '=', id)
    .executeTakeFirst()

  if (!profile) return null

  // Fetch passport entries then enrich with tournament data
  const rawPassport = await db
    .selectFrom('sports_passport')
    .selectAll()
    .where('athlete_id', '=', id)
    .orderBy('year', 'desc')
    .execute()

  const tournamentIds = rawPassport
    .map(p => p.tournament_id)
    .filter((tid): tid is string => tid !== null)

  const tournaments = tournamentIds.length > 0
    ? await db.selectFrom('tournaments').selectAll()
        .where('tournament_id', 'in', tournamentIds).execute()
    : []

  const tMap = new Map(tournaments.map(t => [t.tournament_id, t]))

  const passport = rawPassport.map(p => ({
    ...p,
    tournament_name: p.tournament_id ? (tMap.get(p.tournament_id)?.tournament_name ?? null) : null,
    tournament_level: p.tournament_id ? (tMap.get(p.tournament_id)?.level ?? null) : null,
  }))

  const [education, skills] = await Promise.all([
    db.selectFrom('athlete_education').selectAll().where('athlete_id', '=', id).execute(),
    db.selectFrom('athlete_skills').selectAll().where('athlete_id', '=', id).execute(),
  ])
  console.log('Fetching athlete with ID:')

  return {
    ...profile,
    full_name: profile.first_name + ' ' + profile.last_name,
    passport,
    education,
    skills,
  }
}

export async function updateAthlete(id: string, data: UpdateAthleteInput) {
  const set: UpdateableAthleteProfile = { updated_at: new Date().toISOString() }

  if (data.primary_sport_id !== undefined) set.primary_sport_id = data.primary_sport_id
  if (data.date_of_birth !== undefined) set.date_of_birth = data.date_of_birth
  if (data.gender !== undefined) set.gender = data.gender
  if (data.city !== undefined) set.city = data.city
  if (data.state !== undefined) set.state = data.state
  if (data.country !== undefined) set.country = data.country
  if (data.bio !== undefined) set.bio = data.bio
  if (data.profile_photo_url !== undefined) set.profile_photo_url = data.profile_photo_url
  if (data.profile_status !== undefined) set.profile_status = data.profile_status
  if (data.languages !== undefined) set.languages = data.languages
  if (data.is_still_competing !== undefined) set.is_still_competing = data.is_still_competing
  if (data.is_open_to_work !== undefined) set.is_open_to_work = data.is_open_to_work

  await db.updateTable('athlete_profiles').set(set).where('athlete_id', '=', id).execute()
  return db.selectFrom('athlete_profiles').selectAll().where('athlete_id', '=', id).executeTakeFirst()
}

export async function getPassport(athleteId: string) {
  const raw = await db
    .selectFrom('sports_passport')
    .selectAll()
    .where('athlete_id', '=', athleteId)
    .orderBy('year', 'desc')
    .execute()

  const tids = raw.map(p => p.tournament_id).filter((t): t is string => t !== null)
  const ts = tids.length > 0
    ? await db.selectFrom('tournaments').selectAll().where('tournament_id', 'in', tids).execute()
    : []
  const tMap = new Map(ts.map(t => [t.tournament_id, t]))

  return raw.map(p => ({
    ...p,
    tournament_name: p.tournament_id ? (tMap.get(p.tournament_id)?.tournament_name ?? null) : null,
    tournament_level: p.tournament_id ? (tMap.get(p.tournament_id)?.level ?? null) : null,
  }))
}

export async function addPassportEntry(athleteId: string, data: CreatePassportEntryInput) {
  const entry = await db.insertInto('sports_passport')
    .values({
      passport_id: generateId(),
      athlete_id: athleteId,
      sport_id: data.sport_id,
      tournament_id: data.tournament_id ?? null,
      tournament_name_override: data.tournament_name_override ?? null,
      level_override: data.level_override ?? null,
      year: data.year,
      medal: data.medal ?? null,
      is_personal_best: data.is_personal_best ?? 0,
      pb_value: data.pb_value ?? null,
      pb_unit: data.pb_unit ?? null,
      notes: data.notes ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const athlete = await db
    .selectFrom('athlete_profiles')
    .select('user_id')
    .where('athlete_id', '=', athleteId)
    .executeTakeFirstOrThrow()

  await setOnboardingComplete(athlete.user_id)
  return { ...entry, onboarding_step: 3, onboarding_complete: true }
}

export async function getSkills(athleteId: string) {
  return db.selectFrom('athlete_skills').selectAll().where('athlete_id', '=', athleteId).execute()
}

export async function addSkills(athleteId: string, skills: SkillInput[]) {
  const rows = skills.map(s => ({
    skill_id: generateId(),
    athlete_id: athleteId,
    skill_name: s.skill_name,
    category: s.category ?? 'sport_specific' as const,
  }))
  return db.insertInto('athlete_skills')
    .values(rows)
    .onConflict(oc => oc.columns(['athlete_id', 'skill_name']).doNothing())
    .returningAll()
    .execute()
}

export async function updateEducation(educationId: string, athleteId: string, data: EducationInput) {
  return db.updateTable('athlete_education')
    .set({
      institution_name: data.institution_name,
      degree: data.degree ?? null,
      field_of_study: data.field_of_study ?? null,
      start_year: data.start_year ?? null,
      end_year: data.end_year ?? null,
      is_current: (data.is_current ?? (data.end_year == null ? 1 : 0)) as 0 | 1,
    })
    .where('education_id', '=', educationId)
    .where('athlete_id', '=', athleteId)
    .returningAll()
    .executeTakeFirst()
}

export async function getEducation(athleteId: string) {
  return db.selectFrom('athlete_education').selectAll().where('athlete_id', '=', athleteId).execute()
}

// ── Pending Actions ───────────────────────────────────────────────────────
export async function  getProfilePercent(athleteId:string){
   const [educationRows, skillRows, passportRows] = await Promise.all([
    db.selectFrom('athlete_education').select('education_id').where('athlete_id', '=', athleteId).execute(),
    db.selectFrom('athlete_skills').select('skill_id').where('athlete_id', '=', athleteId).execute(),
    db.selectFrom('sports_passport').select('passport_id').where('athlete_id', '=', athleteId).execute(),
  ])

  const hasEducation = educationRows.length > 0
  const hasSkills = skillRows.length > 0
  const hasPassport = passportRows.length > 0

  // Profile stats: passport = 50%, education = 25%, skills = 25%
  let profilePercent = 0
  if (hasPassport) profilePercent += 50
  if (hasEducation) profilePercent += 25
  if (hasSkills) profilePercent += 25

  return {profilePercent,hasEducation, hasSkills, hasPassport}

}

export async function getPendingActions(athleteId: string) {
  const profile = await db
    .selectFrom('athlete_profiles')
    .select(['athlete_id', 'user_id'])
    .where('athlete_id', '=', athleteId)
    .executeTakeFirst()

  if (!profile) return { error: 'NOT_FOUND' as const }

  // Check which sections have data
 
  const actions: Array<{ type: string; details: string; profile_stats?: string }> = []
  const {profilePercent, hasEducation, hasSkills, hasPassport} = await getProfilePercent(profile.athlete_id)
  // Profile completion action
  if (profilePercent < 100) {
    const missing: string[] = []
    if (!hasEducation) missing.push('education')
    if (!hasSkills) missing.push('skills')
    if (!hasPassport) missing.push('sports passport')
    actions.push({
      type: 'profile',
      details: `add ${missing.join(', ')}`,
      profile_stats: `${profilePercent}%`,
    })
  }

  // Pending connection requests
  const pendingRequests = await db
    .selectFrom('connection_requests')
    .select('request_id')
    .where('receiver_id', '=', profile.user_id)
    .where('status', '=', 'pending')
    .execute()

  if (pendingRequests.length > 0) {
    actions.push({
      type: 'requests',
      details: `${pendingRequests.length} pending request${pendingRequests.length > 1 ? 's' : ''}`,
    })
  }

  return { actions, profile_stats: `${profilePercent}%` }
}

export async function addEducation(athleteId: string, data: EducationInput) {
  return db.insertInto('athlete_education')
    .values({
      education_id: generateId(),
      athlete_id: athleteId,
      institution_name: data.institution_name,
      degree: data.degree ?? null,
      field_of_study: data.field_of_study ?? null,
      start_year: data.start_year ?? null,
      end_year: data.end_year ?? null,
      is_current: (data.is_current ?? (data.end_year == null ? 1 : 0)) as 0 | 1,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

// ── Photo upload ─────────────────────────────────────────────────────────

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export async function uploadPhoto(athleteId: string, file: File) {
  const ext = ALLOWED_MIME[file.type]
  if (!ext) throw new Error('INVALID_TYPE')

  const filename = `${athleteId}${ext}`
  const filepath = join(UPLOADS_DIR, filename)

  await Bun.write(filepath, file)

  const photoUrl = `/api/athletes/${athleteId}/photo`
  await db.updateTable('athlete_profiles')
    .set({ profile_photo_url: photoUrl, updated_at: new Date().toISOString() })
    .where('athlete_id', '=', athleteId)
    .execute()

  return { profile_photo_url: photoUrl }
}

export async function getPhoto(athleteId: string) {
  // Try each supported extension
  for (const ext of ['.jpg', '.png', '.webp']) {
    const filepath = join(UPLOADS_DIR, `${athleteId}${ext}`)
    const file = Bun.file(filepath)
    if (await file.exists()) {
      return file
    }
  }
  return null
}
