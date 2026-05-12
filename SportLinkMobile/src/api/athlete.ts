import { Platform } from 'react-native'
import { apiCall } from './client'
import { useAuthStore } from '../stores/authStore'
import type {
  AthleteFullProfile, PassportEntry, Skill, EducationEntry,
  CreatePassportEntryInput, CreateEducationInput, SkillCategory,
  AthleteListItem, AthleteFilters,
} from '../types/athlete'

const BASE_URL = Platform.OS === 'android'
  ? 'http://192.168.0.108:3000/api'
  : 'http://localhost:3000/api'

export interface ProfileStatusResponse {
  completeness: string
  hasEducation: boolean
  hasSkills: boolean
  hasPassport: boolean
}

export interface PendingAction {
  type: string
  details: string
  profile_stats?: string
}

export interface PendingActionsResponse {
  actions: PendingAction[]
  profile_stats: string
}

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

function buildQuery(filters?: AthleteFilters): string {
  if (!filters) return ''
  const parts: string[] = []
  if (filters.sport) parts.push(`sport=${encodeURIComponent(filters.sport)}`)
  if (filters.level) parts.push(`level=${encodeURIComponent(filters.level)}`)
  if (filters.city) parts.push(`city=${encodeURIComponent(filters.city)}`)
  if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`)
  if (filters.page) parts.push(`page=${filters.page}`)
  const qs = parts.join('&')
  return qs ? `?${qs}` : ''
}

export const athleteApi = {
  getAll: (filters?: AthleteFilters) =>
    apiCall<{ data: AthleteListItem[] }>(`/athletes${buildQuery(filters)}`),

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

  getPendingActions: (athleteId: string) =>
    apiCall<PendingActionsResponse>(`/athletes/${athleteId}/pending-actions`),

  getProfileStatus: (athleteId: string) =>
    apiCall<ProfileStatusResponse>(`/athletes/${athleteId}/profile-status`),

  uploadPhoto: async (athleteId: string, photo: { uri: string; type: string; fileName: string }) => {
    const formData = new FormData()
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type,
      name: photo.fileName,
    } as any)

    const token = useAuthStore.getState().accessToken
    const res = await fetch(`${BASE_URL}/athletes/${athleteId}/photo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.message ?? 'Upload failed')
    return json as { data: { profile_photo_url: string } }
  },

  getPhotoUrl: (athleteId: string) =>
    `${BASE_URL}/athletes/${athleteId}/photo`,
}
