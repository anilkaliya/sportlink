import { db } from '../../db/connection'
import { generateId } from '../../shared/id'
import type { UpdateableAthleteProfile } from '../../db/schema'
import type {
  CreateAthleteInput, UpdateAthleteInput,
  CreatePassportEntryInput, SkillInput,
} from './athlete.types'
import { incrementOnboardingStep, setOnboardingComplete } from '../users/user.service'

export async function getAllAthletes() {
  return db.selectFrom('athlete_profiles').selectAll().orderBy('created_at', 'desc').execute()
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

export async function addSkill(athleteId: string, data: SkillInput) {
  return db.insertInto('athlete_skills')
    .values({
      skill_id: generateId(),
      athlete_id: athleteId,
      skill_name: data.skill_name,
      category: data.category ?? 'sport_specific',
    })
    .onConflict(oc => oc.columns(['athlete_id', 'skill_name']).doNothing())
    .returningAll()
    .executeTakeFirst()
}
