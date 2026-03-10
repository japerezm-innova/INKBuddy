import { create } from 'zustand'
import type { Profile } from '../types/auth'

interface AuthStore {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}))
