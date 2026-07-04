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

  function handleSignOut() {
    userApi.logout().catch(() => {})
    clearAuth()
  }

  // No athlete id available (e.g. session restored without it) — the query is
  // disabled, so render an explicit empty state instead of a blank screen.
  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Profile unavailable</Text>
          <Text style={styles.emptyText}>
            We couldn't find your athlete profile for this session. Sign in again to reload it.
          </Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load profile'} />
  if (!profile) return <LoadingSpinner />

  const isOwner = currentUserId != null && currentUserId === profile.user_id

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
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
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
