import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRoute } from '@react-navigation/native'
import { athleteApi } from '../api/athlete'
import { userApi } from '../api/user'
import { useAthleteStore } from '../stores/athleteStore'
import { useAuthStore } from '../stores/authStore'
import { ProfileHero } from '../components/ProfileHero/ProfileHero'
import { SportsPassport } from '../components/SportsPassport/SportsPassport'
import { SkillsCard } from '../components/SkillsCard/SkillsCard'
import { EducationCard } from '../components/EducationCard/EducationCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { colors, spacing, fontSize, radii } from '../theme'
import type { ProfileStackScreenProps } from '../navigation/types'

type RouteProps = ProfileStackScreenProps<'Profile'>['route']

export function ProfileScreen() {
  const route = useRoute<RouteProps>()
  const ownAthleteId = useAthleteStore(s => s.athlete_id)
  const id = route.params?.id ?? ownAthleteId ?? ''

  const setAthleteData = useAthleteStore(s => s.setAthleteData)
  const clearAthlete = useAthleteStore(s => s.clearAthlete)
  const profile = useAthleteStore(s => s.profile)
  const passport = useAthleteStore(s => s.passport)
  const education = useAthleteStore(s => s.education)
  const skills = useAthleteStore(s => s.skills)
  const currentUserId = useAuthStore(s => s.userId)
  const clearAuth = useAuthStore(s => s.clearAuth)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['athlete', id],
    queryFn: () => athleteApi.getById(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (!data) return
    const { passport, education, skills, ...profileFields } = data.data
    setAthleteData({ profile: profileFields, passport, education, skills })
  }, [data, setAthleteData])

  useEffect(() => () => { clearAthlete() }, [id, clearAthlete])

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load profile'} />
  if (!profile) return null

  const isOwner = currentUserId != null && currentUserId === profile.user_id

  function handleSignOut() {
    userApi.logout().catch(() => {})
    clearAuth()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ProfileHero profile={profile} passport={passport} />
        <SportsPassport entries={passport} isOwner={isOwner} />
        <SkillsCard skills={skills} isOwner={isOwner} />
        <EducationCard education={education} isOwner={isOwner} />
        {isOwner && (
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  signOutBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  signOutText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#dc2626',
  },
})
