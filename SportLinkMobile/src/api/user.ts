import { apiCall } from './client'

interface RegisterPayload {
  email: string
  mobile_number: string
  password: string
}

interface LoginPayload {
  email: string
  password: string
}

export interface UserResponse {
  user_id: string
  email: string
  phone: string | null
  role: string
  onboarding_step: number
  onboarding_complete: boolean
  athlete_id?: string
}

export const userApi = {
  register: (payload: RegisterPayload) =>
    apiCall<{ data: UserResponse }>('/user/register', { method: 'POST', body: payload }),

  login: (payload: LoginPayload) =>
    apiCall<{ data: UserResponse; accessToken: string }>('/user/login', { method: 'POST', body: payload }),

  refresh: () =>
    apiCall<{ accessToken: string }>('/user/refresh', { method: 'POST' }),

  logout: () =>
    apiCall<{ success: boolean }>('/user/logout', { method: 'POST' }),
}
