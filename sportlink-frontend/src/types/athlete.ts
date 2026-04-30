export type SportLevel = 'international' | 'national' | 'state' | 'district'
export type Medal = 'gold' | 'silver' | 'bronze' | 'none'
export type PbUnit = 'seconds' | 'meters' | 'kg' | 'points' | 'other'
export type SkillCategory = 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'

// Mirrors athlete_profiles + joined users.full_name
export interface AthleteProfile {
  athlete_id: string
  user_id: string
  full_name: string             // joined from users
  primary_sport_id: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  city: string | null
  state: string | null
  country: string
  bio: string | null
  profile_photo_url: string | null
  profile_status: 'draft' | 'active' | 'suspended'
  languages: string | null      // CSV: 'hi,en,kn'
  is_still_competing: 0 | 1
  is_open_to_work: 0 | 1
  created_at: string
  updated_at: string
}

// Mirrors sports_passport + joined tournament data
export interface PassportEntry {
  passport_id: string
  athlete_id: string
  sport_id: string
  tournament_id: string | null
  tournament_name_override: string | null
  level_override: SportLevel | null
  year: number
  medal: Medal | null
  is_personal_best: 0 | 1
  pb_value: number | null
  pb_unit: PbUnit | null
  notes: string | null
  created_at: string
  // joined from tournaments
  tournament_name: string | null
  tournament_level: SportLevel | null
}

// Mirrors athlete_education
export interface EducationEntry {
  education_id: string
  athlete_id: string
  institution_name: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null        // null = ongoing
  is_current: 0 | 1
  created_at: string
}

// Mirrors athlete_skills
export interface Skill {
  skill_id: string
  athlete_id: string
  skill_name: string
  category: SkillCategory
  endorsement_count: number
  created_at: string
}

// Full response shape from GET /api/athletes/:id
export interface AthleteFullProfile {
  data: AthleteProfile & {
    passport: PassportEntry[]
    education: EducationEntry[]
    skills: Skill[]
  }
}

// ── Inputs ────────────────────────────────────────────────────────────────

export interface CreatePassportEntryInput {
  sport_id: string
  tournament_id?: string
  tournament_name_override?: string
  level_override?: SportLevel
  year: number
  medal?: Medal
  notes?: string
  is_personal_best?: 0 | 1
  pb_value?: number
  pb_unit?: PbUnit
}

export interface CreateEducationInput {
  institution_name: string
  degree?: string
  field_of_study?: string
  start_year?: number
  end_year?: number | null
  is_current?: 0 | 1
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function parseLanguages(csv: string | null): string[] {
  if (!csv) return []
  return csv.split(',').map(l => l.trim()).filter(Boolean)
}

export function resolveLevel(entry: PassportEntry): SportLevel | null {
  return entry.tournament_level ?? entry.level_override ?? null
}

export function resolveTournamentName(entry: PassportEntry): string {
  return entry.tournament_name ?? entry.tournament_name_override ?? 'Tournament'
}
