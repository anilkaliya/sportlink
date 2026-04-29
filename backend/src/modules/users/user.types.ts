// ── Inputs ─────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string
  mobile_number: string
  password: string
  role?: 'athlete' | 'recruiter' | 'admin'
}

export interface LoginInput {
  email: string
  password: string
}

// ── Responses ──────────────────────────────────────────────────────────────

export interface UserResponse {
  user_id: string
  email: string
  phone: string | null
  role: 'athlete' | 'recruiter' | 'admin'
  is_active: 0 | 1
  onboarding_step: number
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}
