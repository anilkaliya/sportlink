import { create } from 'zustand'
import type { AthleteProfile, PassportEntry, EducationEntry, Skill } from '../types/athlete'

interface AthleteState {
  profile: AthleteProfile | null
  passport: PassportEntry[]
  education: EducationEntry[]
  skills: Skill[]
  setAthleteData: (data: {
    profile: AthleteProfile
    passport: PassportEntry[]
    education: EducationEntry[]
    skills: Skill[]
  }) => void
  clearAthlete: () => void
}

export const useAthleteStore = create<AthleteState>(set => ({
  profile: null,
  passport: [],
  education: [],
  skills: [],
  setAthleteData: data => set(data),
  clearAthlete: () => set({ profile: null, passport: [], education: [], skills: [] }),
}))
