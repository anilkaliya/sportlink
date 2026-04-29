// ── Inputs ─────────────────────────────────────────────────────────────────

export interface CreateAthleteInput {
  user_id: string
  primary_sport_id: string
  first_name: string 
  last_name: string
  date_of_birth: string 
  gender: 'male' | 'female' | 'other' 
  city: string 
  state: string 
  country: string
  bio?: string | null
  profile_photo_url?: string | null
  languages: string 
}

export interface UpdateAthleteInput {
  primary_sport_id: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other' 
  city: string
  state: string 
  country: string 
  bio?: string | null
  profile_photo_url?: string | null
  profile_status?: 'draft' | 'active' | 'suspended'
  languages?: string | null
  is_still_competing?: 0 | 1
  is_open_to_work?: 0 | 1
}

export interface CreatePassportEntryInput {
  sport_id: string
  tournament_id?: string | null
  tournament_name_override?: string | null
  level_override?: 'international' | 'national' | 'state' | 'district' | null
  year: number
  medal?: 'gold' | 'silver' | 'bronze' | 'none' | null
  is_personal_best?: 0 | 1
  pb_value?: number | null
  pb_unit?: 'seconds' | 'meters' | 'kg' | 'points' | 'other' | null
  notes?: string | null
}

export interface SkillInput {
  skill_name: string
  category?: 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'
}

// ── Responses ──────────────────────────────────────────────────────────────

export interface AthleteProfile {
  athlete_id: string
  user_id: string
  primary_sport_id: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  city: string | null
  state: string | null
  country: string
  bio: string | null
  profile_photo_url: string | null
  profile_status: 'draft' | 'active' | 'suspended'
  languages: string | null
  is_still_competing: 0 | 1
  is_open_to_work: 0 | 1
  created_at: string
  updated_at: string
  passport?: PassportEntry[]
  education?: EducationEntry[]
  skills?: SkillEntry[]
}

export interface PassportEntry {
  passport_id: string
  athlete_id: string
  sport_id: string
  tournament_id: string | null
  tournament_name_override: string | null
  level_override: 'international' | 'national' | 'state' | 'district' | null
  year: number
  medal: 'gold' | 'silver' | 'bronze' | 'none' | null
  is_personal_best: 0 | 1
  pb_value: number | null
  pb_unit: 'seconds' | 'meters' | 'kg' | 'points' | 'other' | null
  notes: string | null
  created_at: string
}

export interface EducationEntry {
  education_id: string
  athlete_id: string
  institution_name: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
  is_current: 0 | 1
  created_at: string
}

export interface SkillEntry {
  skill_id: string
  athlete_id: string
  skill_name: string
  category: 'sport_specific' | 'soft_skill' | 'technical' | 'leadership'
  endorsement_count: number
  created_at: string
}
