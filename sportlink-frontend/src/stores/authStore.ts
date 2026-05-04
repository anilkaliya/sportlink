import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  userId: string | null
  setAuthenticated: (value: boolean) => void
  setAccessToken: (token: string | null) => void
  setUserId: (id: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  accessToken: null,
  userId: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setAccessToken: (token) => set({ accessToken: token }),
  setUserId: (id) => set({ userId: id }),
  clearAuth: () => set({ isAuthenticated: false, accessToken: null, userId: null }),
}))
