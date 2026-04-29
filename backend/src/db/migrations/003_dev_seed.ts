/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from 'kysely'

// Fixed IDs — stable across re-runs
const USER_ID    = 'f47ac10b-58cc-4372-a567-0e02b2c3d000'
const ATHLETE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d001'

// Sport IDs from 002_seed_lookups
const ATHLETICS = 'a0000001-0000-4000-8000-000000000001'

// Tournament IDs from 002_seed_lookups
const T_ASIAN_GAMES  = 'b0000001-0000-4000-8000-000000000013'
const T_NAT_ATH      = 'b0000001-0000-4000-8000-000000000007'
const T_KHELO_INDIA  = 'b0000001-0000-4000-8000-000000000012'

export async function up(db: Kysely<any>): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    console.log('Skipping dev seed in production')
    return
  }

  await db.insertInto('users').values({
    user_id: USER_ID,
    email: 'arjun.sharma@sportlink.in',
    password_hash: 'dev-hash-not-real',
    role: 'athlete',
  }).onConflict(oc => oc.column('email').doNothing()).execute()

  await db.insertInto('athlete_profiles').values({
    athlete_id: ATHLETE_ID,
    user_id: USER_ID,
    primary_sport_id: ATHLETICS,
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    bio: 'National champion sprinter — 100m & 200m. Asian Games gold medalist representing India.',
    languages: 'en,hi,kn',
    is_still_competing: 1,
    is_open_to_work: 1,
    profile_status: 'active',
  }).onConflict(oc => oc.column('athlete_id').doNothing()).execute()

  await db.insertInto('sports_passport').values([
    {
      passport_id: 'p1000001-0000-4000-8000-000000000001',
      athlete_id: ATHLETE_ID,
      sport_id: ATHLETICS,
      tournament_id: T_ASIAN_GAMES,
      tournament_name_override: null,
      level_override: null,
      year: 2023,
      medal: 'gold',
      is_personal_best: 1,
      pb_value: 9.98,
      pb_unit: 'seconds',
      notes: '100m Final',
    },
    {
      passport_id: 'p1000001-0000-4000-8000-000000000002',
      athlete_id: ATHLETE_ID,
      sport_id: ATHLETICS,
      tournament_id: T_NAT_ATH,
      tournament_name_override: null,
      level_override: null,
      year: 2023,
      medal: 'gold',
      is_personal_best: 0,
      pb_value: null,
      pb_unit: null,
      notes: '100m Final',
    },
    {
      passport_id: 'p1000001-0000-4000-8000-000000000003',
      athlete_id: ATHLETE_ID,
      sport_id: ATHLETICS,
      tournament_id: T_KHELO_INDIA,
      tournament_name_override: null,
      level_override: null,
      year: 2022,
      medal: 'silver',
      is_personal_best: 0,
      pb_value: null,
      pb_unit: null,
      notes: '200m Final',
    },
    {
      passport_id: 'p1000001-0000-4000-8000-000000000004',
      athlete_id: ATHLETE_ID,
      sport_id: ATHLETICS,
      tournament_id: null,
      tournament_name_override: 'Karnataka State Athletics Championship',
      level_override: 'state',
      year: 2021,
      medal: 'gold',
      is_personal_best: 0,
      pb_value: null,
      pb_unit: null,
      notes: '100m Final',
    },
  ]).onConflict(oc => oc.column('passport_id').doNothing()).execute()

  await db.insertInto('athlete_education').values([
    {
      education_id: 'e1000001-0000-4000-8000-000000000001',
      athlete_id: ATHLETE_ID,
      institution_name: 'SAI National Centre of Excellence, Bengaluru',
      degree: 'Certificate',
      field_of_study: 'Sports Science & High Performance',
      start_year: 2020,
      end_year: null,
      is_current: 1,
    },
    {
      education_id: 'e1000001-0000-4000-8000-000000000002',
      athlete_id: ATHLETE_ID,
      institution_name: 'Kendriya Vidyalaya No. 1, Bengaluru',
      degree: 'Secondary Education (CBSE)',
      field_of_study: null,
      start_year: 2014,
      end_year: 2020,
      is_current: 0,
    },
  ]).onConflict(oc => oc.column('education_id').doNothing()).execute()

  await db.insertInto('athlete_skills').values([
    { skill_id: 's1000001-0000-4000-8000-000000000001', athlete_id: ATHLETE_ID, skill_name: 'Sprint Technique', category: 'sport_specific' },
    { skill_id: 's1000001-0000-4000-8000-000000000002', athlete_id: ATHLETE_ID, skill_name: 'Race Strategy', category: 'sport_specific' },
    { skill_id: 's1000001-0000-4000-8000-000000000003', athlete_id: ATHLETE_ID, skill_name: 'Strength & Conditioning', category: 'technical' },
    { skill_id: 's1000001-0000-4000-8000-000000000004', athlete_id: ATHLETE_ID, skill_name: 'Sports Nutrition', category: 'technical' },
    { skill_id: 's1000001-0000-4000-8000-000000000005', athlete_id: ATHLETE_ID, skill_name: 'Team Leadership', category: 'leadership' },
    { skill_id: 's1000001-0000-4000-8000-000000000006', athlete_id: ATHLETE_ID, skill_name: 'Mental Conditioning', category: 'soft_skill' },
  ]).onConflict(oc => oc.column('skill_id').doNothing()).execute()

  console.log(`\n✓ Dev seed complete. Athlete ID: ${ATHLETE_ID}\n`)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('athlete_skills').where('athlete_id', '=', ATHLETE_ID).execute()
  await db.deleteFrom('athlete_education').where('athlete_id', '=', ATHLETE_ID).execute()
  await db.deleteFrom('sports_passport').where('athlete_id', '=', ATHLETE_ID).execute()
  await db.deleteFrom('athlete_profiles').where('athlete_id', '=', ATHLETE_ID).execute()
  await db.deleteFrom('users').where('user_id', '=', USER_ID).execute()
}
