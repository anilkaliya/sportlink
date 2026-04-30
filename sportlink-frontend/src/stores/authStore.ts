import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  setAuthenticated: (value: boolean) => void
  setAccessToken: (token: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  accessToken: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ isAuthenticated: false, accessToken: null }),
}))
