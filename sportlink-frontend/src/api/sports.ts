import { apiCall } from './client'

export interface Sport {
  id: string
  name: string
}

export interface Tournament {
  id: string
  name: string
  level: string
}

export const sportsApi = {
  getSports: () => apiCall<{ data: Sport[] }>('/sports').then((r: { data: Sport[] }) => r.data),
  getTournaments: () => apiCall<{ data: Tournament[] }>('/tournaments').then((r: { data: Tournament[] }) => r.data),
}
