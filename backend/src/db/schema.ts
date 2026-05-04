import type { Generated, Insertable, Selectable, Updateable } from 'kysely'

// ── Lookup tables ──────────────────────────────────────────────────────────

interface SportsTable {
  sport_id: string
  sport_name: string
  sport_category: 'individual' | 'team' | 'combat' | 'racket' | 'aquatic' | 'other'
  governing_body: string | null
  has_personal_bests: Generated<0 | 1>
  icon_url: string | null
  created_at: Generated<string>
}

interface TournamentsTable {
  tournament_id: string
  tournament_name: string
  sport_id: string | null
  level: 'international' | 'national' | 'state' | 'district'
  organizing_body: string | null
  is_active: Generated<0 | 1>
  created_at: Generated<string>
}

// ── Auth ───────────────────────────────────────────────────────────────────

interface UsersTable {
  user_id: string
  email: string
  phone: string | null
  password_hash: string
  role: Generated<'athlete' | 'recruiter' | 'admin'>
  onboarding_step: Generated<number> | null
  is_active: Generated<0 | 1>
  created_at: Generated<string>
  updated_at: Generated<string>
  
}

// ── Core profile ───────────────────────────────────────────────────────────

interface AthleteProfilesTable {
  athlete_id: string
  user_id: string
  first_name: string
  last_name: string
  primary_sport_id: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  city: string | null
  state: string | null
  country: Generated<string>
  bio: string | null
  profile_photo_url: string | null
  profile_status: Generated<'draft' | 'active' | 'suspended'>
  languages: string | null
  is_still_competing: Generated<0 | 1>
  is_open_to_work: Generated<0 | 1>
  created_at: Generated<string>
  updated_at: Generated<string>
}

interface SportsPassportTable {
  passport_id: string
  athlete_id: string
  sport_id: string
  tournament_id: string | null
  tournament_name_override: string | null
  level_override: 'international' | 'national' | 'state' | 'district' | null
  year: number
  medal: 'gold' | 'silver' | 'bronze' | 'none' | null
  is_personal_best: Generated<0 | 1>
  pb_value: number | null
  pb_unit: 'seconds' | 'meters' | 'kg' | 'points' | 'other' | null
  notes: string | null
  created_at: Generated<string>
}

interface AthleteEducationTable {
  education_id: string
  athlete_id: string
  institution_name: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
  is_current: Generated<0 | 1>
  created_at: Generated<string>
}

interface AthleteSkillsTable {
  skill_id: string
  athlete_id: string
  skill_name: string
  category: Generated<'sport_specific' | 'soft_skill' | 'technical' | 'leadership'>
  endorsement_count: Generated<number>
  created_at: Generated<string>
}

// ── Connections ────────────────────────────────────────────────────────────

interface ConnectionRequestsTable {
  request_id:  string
  sender_id:   string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at:  Generated<string>
  updated_at:  Generated<string>
}

interface ConnectionsTable {
  connection_id: string
  user_id_a:     string   // lexicographically smaller UUID
  user_id_b:     string
  created_at:    Generated<string>
}

// ── Auth tokens ────────────────────────────────────────────────────────────

interface RefreshTokensTable {
  token_hash: string
  user_id: string
  expires_at: string
  created_at: string
}

// ── Database interface ─────────────────────────────────────────────────────

export interface Database {
  sports: SportsTable
  tournaments: TournamentsTable
  users: UsersTable
  athlete_profiles: AthleteProfilesTable
  sports_passport: SportsPassportTable
  athlete_education: AthleteEducationTable
  athlete_skills: AthleteSkillsTable
  refresh_tokens: RefreshTokensTable
  connection_requests: ConnectionRequestsTable
  connections: ConnectionsTable
}

// ── Per-table helper types ─────────────────────────────────────────────────

export type Sport = Selectable<SportsTable>
export type InsertableSport = Insertable<SportsTable>

export type Tournament = Selectable<TournamentsTable>
export type InsertableTournament = Insertable<TournamentsTable>

export type User = Selectable<UsersTable>
export type InsertableUser = Insertable<UsersTable>

export type AthleteProfileRow = Selectable<AthleteProfilesTable>
export type InsertableAthleteProfile = Insertable<AthleteProfilesTable>
export type UpdateableAthleteProfile = Updateable<AthleteProfilesTable>

export type SportsPassportRow = Selectable<SportsPassportTable>
export type InsertableSportsPassport = Insertable<SportsPassportTable>

export type AthleteEducationRow = Selectable<AthleteEducationTable>

export type AthleteSkillRow = Selectable<AthleteSkillsTable>
export type InsertableAthleteSkill = Insertable<AthleteSkillsTable>

export type ConnectionRequestRow = Selectable<ConnectionRequestsTable>
export type ConnectionRow = Selectable<ConnectionsTable>
