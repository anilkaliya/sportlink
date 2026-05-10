/**
 * Seed script — creates 3 test users with complete profiles, sports resumes,
 * and mutual connections. Safe to run multiple times (skips if users exist).
 *
 * Inserts directly into the DB via Kysely — no running server required.
 *
 * Usage:  bun run src/db/seed.ts
 *         bun run db:seed
 */

import { db } from './connection'
import { generateId } from '../shared/id'

interface SeedUser {
  name: string
  email: string
  password: string
  phone: string
  firstName: string
  lastName: string
  dob: string
  gender: 'male' | 'female' | 'other'
  city: string
  state: string
  sportId: string
  userId: string
  athleteId: string
}

const USERS: SeedUser[] = [
  {
    name: 'Anil Sharma',
    email: 'anil.sharma@test.com',
    password: 'Test@1234',
    phone: '9876543210',
    firstName: 'Anil',
    lastName: 'Sharma',
    dob: '1998-03-15',
    gender: 'male',
    city: 'Bengaluru',
    state: 'Karnataka',
    sportId: 'a0000001-0000-4000-8000-000000000001', // Athletics
    userId: generateId(),
    athleteId: generateId(),
  },
  {
    name: 'Anil Kaliya',
    email: 'anil.kaliya@test.com',
    password: 'Test@1234',
    phone: '9876543211',
    firstName: 'Anil',
    lastName: 'Kaliya',
    dob: '1999-07-22',
    gender: 'male',
    city: 'Mumbai',
    state: 'Maharashtra',
    sportId: 'a0000001-0000-4000-8000-000000000004', // Cricket
    userId: generateId(),
    athleteId: generateId(),
  },
  {
    name: 'Anil Kumar',
    email: 'anil.kumar@test.com',
    password: 'Test@1234',
    phone: '9876543212',
    firstName: 'Anil',
    lastName: 'Kumar',
    dob: '1997-11-05',
    gender: 'male',
    city: 'Delhi',
    state: 'Delhi',
    sportId: 'a0000001-0000-4000-8000-000000000006', // Football
    userId: generateId(),
    athleteId: generateId(),
  },
]

const PASSPORT_DATA: Record<string, Array<{
  tournament_name_override: string
  level_override: 'international' | 'national' | 'state' | 'district'
  year: number
  medal: 'gold' | 'silver' | 'bronze' | 'none'
  notes?: string
}>> = {
  'anil.sharma@test.com': [
    { tournament_name_override: 'Senior National Athletics Championship', level_override: 'national', year: 2023, medal: 'gold', notes: '100m sprint — 10.45s' },
    { tournament_name_override: 'Karnataka State Meet', level_override: 'state', year: 2022, medal: 'silver', notes: '200m sprint' },
    { tournament_name_override: 'Asian Games Trials', level_override: 'national', year: 2024, medal: 'bronze' },
  ],
  'anil.kaliya@test.com': [
    { tournament_name_override: 'Ranji Trophy', level_override: 'national', year: 2023, medal: 'none', notes: 'Top scorer — 340 runs' },
    { tournament_name_override: 'Mumbai Premier League', level_override: 'state', year: 2024, medal: 'gold' },
  ],
  'anil.kumar@test.com': [
    { tournament_name_override: 'Santosh Trophy', level_override: 'national', year: 2023, medal: 'silver' },
    { tournament_name_override: 'Delhi State Football Championship', level_override: 'state', year: 2022, medal: 'gold', notes: 'Best midfielder award' },
    { tournament_name_override: 'Durand Cup', level_override: 'national', year: 2024, medal: 'bronze' },
  ],
}

const SKILLS_DATA: Record<string, Array<{
  skill_name: string
  category: 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'
}>> = {
  'anil.sharma@test.com': [
    { skill_name: 'Sprint Technique', category: 'sport_specific' },
    { skill_name: 'Endurance Training', category: 'sport_specific' },
    { skill_name: 'Mental Toughness', category: 'soft_skill' },
    { skill_name: 'Race Strategy', category: 'technical' },
  ],
  'anil.kaliya@test.com': [
    { skill_name: 'Batting', category: 'sport_specific' },
    { skill_name: 'Spin Bowling', category: 'sport_specific' },
    { skill_name: 'Team Captain', category: 'leadership' },
    { skill_name: 'Match Analysis', category: 'technical' },
  ],
  'anil.kumar@test.com': [
    { skill_name: 'Dribbling', category: 'sport_specific' },
    { skill_name: 'Set Pieces', category: 'technical' },
    { skill_name: 'Team Leadership', category: 'leadership' },
    { skill_name: 'Fitness Coaching', category: 'soft_skill' },
  ],
}

const EDUCATION_DATA: Record<string, {
  institution_name: string
  degree: string
  field_of_study: string
  start_year: number
  end_year: number | null
}> = {
  'anil.sharma@test.com': {
    institution_name: 'SAI Bengaluru',
    degree: 'Diploma',
    field_of_study: 'Sports Science',
    start_year: 2018,
    end_year: 2021,
  },
  'anil.kaliya@test.com': {
    institution_name: 'Mumbai University',
    degree: 'B.Com',
    field_of_study: 'Commerce',
    start_year: 2019,
    end_year: null,
  },
  'anil.kumar@test.com': {
    institution_name: 'Delhi Sports University',
    degree: 'B.Sc',
    field_of_study: 'Physical Education',
    start_year: 2017,
    end_year: 2020,
  },
}

// ── main ───────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Starting seed…\n')

  for (const user of USERS) {
    console.log(`── ${user.name} ──`)

    // Check if user already exists
    const existing = await db
      .selectFrom('users')
      .select('user_id')
      .where('email', '=', user.email)
      .executeTakeFirst()

    if (existing) {
      console.log('  ⏭ Already seeded, skipping…')
      user.userId = existing.user_id
      const profile = await db
        .selectFrom('athlete_profiles')
        .select('athlete_id')
        .where('user_id', '=', existing.user_id)
        .executeTakeFirst()
      if (profile) user.athleteId = profile.athlete_id
      continue
    }

    // 1. Insert user
    const passwordHash = await Bun.password.hash(user.password)
    await db
      .insertInto('users')
      .values({
        user_id: user.userId,
        email: user.email,
        phone: user.phone,
        password_hash: passwordHash,
        role: 'athlete',
        onboarding_step: 3,
      })
      .execute()
    console.log(`  ✓ User created (${user.userId})`)

    // 2. Insert athlete profile
    await db
      .insertInto('athlete_profiles')
      .values({
        athlete_id: user.athleteId,
        user_id: user.userId,
        first_name: user.firstName,
        last_name: user.lastName,
        date_of_birth: user.dob,
        gender: user.gender,
        city: user.city,
        state: user.state,
        country: 'India',
        primary_sport_id: user.sportId,
        languages: 'hi,en',
        profile_status: 'active',
        is_open_to_work: 1,
      })
      .execute()
    console.log(`  ✓ Athlete profile created (${user.athleteId})`)

    // 3. Insert passport entries
    const passportEntries = PASSPORT_DATA[user.email]!
    for (const entry of passportEntries) {
      await db
        .insertInto('sports_passport')
        .values({
          passport_id: generateId(),
          athlete_id: user.athleteId,
          sport_id: user.sportId,
          tournament_name_override: entry.tournament_name_override,
          level_override: entry.level_override,
          year: entry.year,
          medal: entry.medal,
          notes: entry.notes ?? null,
        })
        .execute()
    }
    console.log(`  ✓ ${passportEntries.length} passport entries added`)

    // 4. Insert skills
    const skills = SKILLS_DATA[user.email]!
    for (const skill of skills) {
      await db
        .insertInto('athlete_skills')
        .values({
          skill_id: generateId(),
          athlete_id: user.athleteId,
          skill_name: skill.skill_name,
          category: skill.category,
        })
        .execute()
    }
    console.log(`  ✓ ${skills.length} skills added`)

    // 5. Insert education
    const edu = EDUCATION_DATA[user.email]!
    await db
      .insertInto('athlete_education')
      .values({
        education_id: generateId(),
        athlete_id: user.athleteId,
        institution_name: edu.institution_name,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        start_year: edu.start_year,
        end_year: edu.end_year,
        is_current: edu.end_year === null ? 1 : 0,
      })
      .execute()
    console.log(`  ✓ Education added`)
  }

  // 6. Create connections: Sharma ↔ Kaliya, Sharma ↔ Kumar
  console.log('\n── Connections ──')
  const [sharma, kaliya, kumar] = USERS

  const pairs: [SeedUser, SeedUser][] = [
    [sharma!, kaliya!],
    [sharma!, kumar!],
  ]

  for (const [a, b] of pairs) {
    // Check if connection already exists
    const [idA, idB] = a.userId < b.userId ? [a.userId, b.userId] : [b.userId, a.userId]
    const existing = await db
      .selectFrom('connections')
      .select('connection_id')
      .where('user_id_a', '=', idA)
      .where('user_id_b', '=', idB)
      .executeTakeFirst()

    if (existing) {
      console.log(`  ⏭ ${a.firstName} ↔ ${b.firstName} already connected`)
      continue
    }

    // Insert accepted connection request
    await db
      .insertInto('connection_requests')
      .values({
        request_id: generateId(),
        sender_id: a.userId,
        receiver_id: b.userId,
        status: 'accepted',
      })
      .execute()

    // Insert connection row (ordered pair)
    await db
      .insertInto('connections')
      .values({
        connection_id: generateId(),
        user_id_a: idA,
        user_id_b: idB,
      })
      .execute()

    console.log(`  ✓ ${a.firstName} ↔ ${b.firstName} connected`)
  }

  console.log('\n✅ Seed complete!\n')
  console.log('Test credentials (all passwords: Test@1234):')
  console.log('  anil.sharma@test.com  — Athletics, Bengaluru')
  console.log('  anil.kaliya@test.com  — Cricket, Mumbai')
  console.log('  anil.kumar@test.com   — Football, Delhi')
  console.log('')
}

export { seed }

// Run directly: bun run src/db/seed.ts
if (import.meta.main) {
  seed().catch(err => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
}
