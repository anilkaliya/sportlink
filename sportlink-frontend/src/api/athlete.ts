import { apiCall } from './client'
import type {
  AthleteFullProfile, PassportEntry, Skill, EducationEntry,
  CreatePassportEntryInput, CreateEducationInput, SkillCategory,
} from '../types/athlete'

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

  addPassportEntry: (athleteId: string, payload: CreatePassportEntryInput) =>
    apiCall<{ data: PassportEntry }>(`/athletes/${athleteId}/passport`, { method: 'POST', body: payload }),

  addSkills: (athleteId: string, skills: { skill_name: string; category: SkillCategory }[]) =>
    apiCall<{ data: Skill[] }>(`/athletes/${athleteId}/skills`, { method: 'POST', body: { skills } }),

  addEducation: (athleteId: string, payload: CreateEducationInput) =>
    apiCall<{ data: EducationEntry }>(`/athletes/${athleteId}/education`, { method: 'POST', body: payload }),

  updateEducation: (athleteId: string, educationId: string, payload: CreateEducationInput) =>
    apiCall<{ data: EducationEntry }>(`/athletes/${athleteId}/education/${educationId}`, { method: 'PATCH', body: payload }),
}
