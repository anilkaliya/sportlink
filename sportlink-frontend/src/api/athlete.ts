import { apiCall } from './client'
import type { AthleteFullProfile, PassportEntry, Skill } from '../types/athlete'

export interface CreateAthletePayload {
  user_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  city: string
  state: string
  country: string
  primary_sport_id: string
  languages: string
}

export interface AddPassportPayload {
  sport_id: string
  tournament_id?: string
  tournament_name_override?: string
  level_override?: 'international' | 'national' | 'state' | 'district'
  year: number
  medal?: 'gold' | 'silver' | 'bronze' | 'none'
  notes?: string
}

export const athleteApi = {
  getById: (id: string) =>
    apiCall<AthleteFullProfile>(`/athletes/${id}`),

  getPassport: (id: string) =>
    apiCall<{ data: PassportEntry[] }>(`/athletes/${id}/passport`),

  getSkills: (id: string) =>
    apiCall<{ data: Skill[] }>(`/athletes/${id}/skills`),

  create: (payload: CreateAthletePayload) =>
    apiCall<{ data: { athlete_id: string } }>('/athletes', { method: 'POST', body: payload }),

  addPassportEntry: (athleteId: string, payload: AddPassportPayload) =>
    apiCall<unknown>(`/athletes/${athleteId}/passport`, { method: 'POST', body: payload }),
}
