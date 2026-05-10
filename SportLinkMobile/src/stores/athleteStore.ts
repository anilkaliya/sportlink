import { create } from 'zustand'
import type { AthleteProfile, PassportEntry, EducationEntry, Skill } from '../types/athlete'

interface AthleteState {
  profile: AthleteProfile | null
  passport: PassportEntry[]
  education: EducationEntry[]
  athlete_id?: string | null
  skills: Skill[]
  setAthleteData: (data: {
    profile: AthleteProfile
    passport: PassportEntry[]
    education: EducationEntry[]
    skills: Skill[]
  }) => void
  clearAthlete: () => void
  addPassportEntry: (entry: PassportEntry) => void
  addSkills: (skills: Skill[]) => void
  addEducation: (edu: EducationEntry) => void
  updateEducation: (edu: EducationEntry) => void
  setProfilePhoto: (url: string) => void
  setAthleteId: (id: string | null) => void
}

export const useAthleteStore = create<AthleteState>(set => ({
  profile: null,
  passport: [],
  education: [],
  skills: [],
  setAthleteData: data => set(data),
  clearAthlete: () => set({ profile: null, passport: [], education: [], skills: [] }),
  addPassportEntry: entry => set(s => ({ passport: [entry, ...s.passport] })),
  addSkills: skills => set(s => ({ skills: [...s.skills, ...skills] })),
  addEducation: edu => set(s => ({ education: [...s.education, edu] })),
  updateEducation: edu => set(s => ({ education: s.education.map(e => e.education_id === edu.education_id ? edu : e) })),
  setProfilePhoto: url => set(s => s.profile ? { profile: { ...s.profile, profile_photo_url: url } } : {}),
  setAthleteId: id => set({ athlete_id: id }),
}))
