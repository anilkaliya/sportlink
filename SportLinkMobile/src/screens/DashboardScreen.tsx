import React from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAthleteStore } from '../stores/athleteStore'
import { connectionsApi } from '../api/connections'
import { athleteApi } from '../api/athlete'
import { sportsApi } from '../api/sports'
import { WelcomeBanner } from '../components/Dashboard/WelcomeBanner'
import { PerformanceSnapshot } from '../components/Dashboard/PerformanceSnapshot'
import { SuggestedAthletes } from '../components/Dashboard/SuggestedAthletes'
import { RecentActivity } from '../components/Dashboard/RecentActivity'
import { PendingActions } from '../components/Dashboard/PendingActions'
import { ConnectionRequests } from '../components/Dashboard/ConnectionRequests'
import { Opportunities } from '../components/Dashboard/Opportunities'
import { Card } from '../components/ui/Card'
import { colors, spacing, fontSize } from '../theme'

const MOCK_PERFORMANCE = {
  yearsActive: 4,
  activeSince: 2020,
  goldMedals: 1,
  timePb: '10.32s',
  timePbEvent: '100m PB',
  distancePb: '6.21m',
  distancePbEvent: 'Distance PB',
  nationalTitles: 0,
}

export function DashboardScreen() {
  const navigation = useNavigation<any>()
  const athleteId = useAthleteStore(s => s.athlete_id)

  const profileQuery = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => athleteApi.getById(athleteId!),
    enabled: !!athleteId,
  })

  const sportsQuery = useQuery({
    queryKey: ['sports'],
    queryFn: () => sportsApi.getSports(),
    staleTime: Infinity,
  })

  const suggestionsQuery = useQuery({
    queryKey: ['suggestions', athleteId],
    queryFn: () => connectionsApi.getSuggestions(athleteId!),
    enabled: !!athleteId,
  })

  const pendingActionsQuery = useQuery({
    queryKey: ['pending-actions', athleteId],
    queryFn: () => athleteApi.getPendingActions(athleteId!),
    enabled: !!athleteId,
  })

  const profileStatusQuery = useQuery({
    queryKey: ['profile-status', athleteId],
    queryFn: () => athleteApi.getProfileStatus(athleteId!),
    enabled: !!athleteId,
  })

  const connectionRequestsQuery = useQuery({
    queryKey: ['connection-requests'],
    queryFn: () => connectionsApi.listRequests(),
  })

  const profileStrength = profileStatusQuery.data
    ? parseInt(profileStatusQuery.data.completeness, 10) || 0
    : 0

  const incomingRequests = connectionRequestsQuery.data?.data?.incoming ?? []

  const profile = profileQuery.data?.data
  const userName = profile?.full_name || 'Athlete'
  const userLocation = profile
    ? [profile.city, profile.state].filter(Boolean).join(', ')
    : ''
  const userSport =
    sportsQuery.data?.find(s => s.id === profile?.primary_sport_id)?.name ?? ''
  const userPhotoUrl = profile?.profile_photo_url
    ? athleteApi.getPhotoUrl(profile.athlete_id)
    : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WelcomeBanner
          name={userName}
          location={userLocation}
          sport={userSport}
          profileStrength={profileStrength}
          photoUrl={userPhotoUrl}
        />
        <PerformanceSnapshot
          yearsActive={MOCK_PERFORMANCE.yearsActive}
          activeSince={MOCK_PERFORMANCE.activeSince}
          goldMedals={MOCK_PERFORMANCE.goldMedals}
          timePb={MOCK_PERFORMANCE.timePb}
          timePbEvent={MOCK_PERFORMANCE.timePbEvent}
          distancePb={MOCK_PERFORMANCE.distancePb}
          distancePbEvent={MOCK_PERFORMANCE.distancePbEvent}
          nationalTitles={MOCK_PERFORMANCE.nationalTitles}
        />
        <ConnectionRequests
          requests={incomingRequests}
          isLoading={connectionRequestsQuery.isLoading}
        />
        <Card>
          <TouchableOpacity
            style={styles.connectionsLink}
            onPress={() => navigation.navigate('Connections')}
          >
            <View>
              <Text style={styles.connectionsTitle}>🔗 My Connections</Text>
              <Text style={styles.connectionsSubtitle}>View all your connected athletes</Text>
            </View>
            <Text style={styles.connectionsArrow}>›</Text>
          </TouchableOpacity>
        </Card>
        <PendingActions
          actions={pendingActionsQuery.data?.actions ?? []}
          profileStats={pendingActionsQuery.data?.profile_stats ?? ''}
          isLoading={pendingActionsQuery.isLoading}
        />
        <Opportunities />
        <SuggestedAthletes
          athletes={suggestionsQuery.data?.suggestions ?? []}
          isLoading={suggestionsQuery.isLoading}
        />
        <RecentActivity />
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
  connectionsLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionsTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  connectionsSubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  connectionsArrow: {
    fontSize: 28,
    color: colors.accent,
    fontWeight: '600',
  },
})
