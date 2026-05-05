import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAthleteStore } from '../stores/athleteStore'
import { connectionsApi } from '../api/connections'
import { athleteApi } from '../api/athlete'
import { WelcomeBanner } from '../components/Dashboard/WelcomeBanner'
import { PerformanceSnapshot } from '../components/Dashboard/PerformanceSnapshot'
import { SuggestedAthletes } from '../components/Dashboard/SuggestedAthletes'
import { RecentActivity } from '../components/Dashboard/RecentActivity'
import { PendingActions } from '../components/Dashboard/PendingActions'
import { ConnectionRequests } from '../components/Dashboard/ConnectionRequests'
import { Opportunities } from '../components/Dashboard/Opportunities'
import { colors, spacing } from '../theme'

const MOCK_USER = {
  name: 'Anil Kumar',
  location: 'Bengaluru, Karnataka',
  sport: 'Athletics',
  photoUrl: null as string | null,
}

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
  const athleteId = useAthleteStore(s => s.athlete_id)

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WelcomeBanner
          name={MOCK_USER.name}
          location={MOCK_USER.location}
          sport={MOCK_USER.sport}
          profileStrength={profileStrength}
          photoUrl={MOCK_USER.photoUrl}
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
})
