import { useQuery } from '@tanstack/react-query'
import { useAthleteStore } from '../../stores/athleteStore'
import { connectionsApi } from '../../api/connections'
import { athleteApi } from '../../api/athlete'
import { WelcomeBanner } from '../../components/Dashboard/WelcomeBanner/WelcomeBanner'
import { PerformanceSnapshot } from '../../components/Dashboard/PerformanceSnapshot/PerformanceSnapshot'
import { SuggestedAthletes } from '../../components/Dashboard/SuggestedAthletes/SuggestedAthletes'
import { RecentActivity } from '../../components/Dashboard/RecentActivity/RecentActivity'
import { PendingActions } from '../../components/Dashboard/PendingActions/PendingActions'
import { ConnectionRequests } from '../../components/Dashboard/ConnectionRequests/ConnectionRequests'
import { Opportunities } from '../../components/Dashboard/Opportunities/Opportunities'
import styles from './DashboardPage.module.css'

// Mock data — will be replaced with real API calls later
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

export function DashboardPage() {
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

  const profileStrength = profileStatusQuery.data
    ? parseInt(profileStatusQuery.data.completeness, 10) || 0
    : 0

  return (
    <div className={styles.page}>
      <div className={styles.main}>
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
        <SuggestedAthletes
          athletes={suggestionsQuery.data?.suggestions ?? []}
          isLoading={suggestionsQuery.isLoading}
        />
        <RecentActivity />
      </div>
      <div className={styles.sidebar}>
        <PendingActions
          actions={pendingActionsQuery.data?.actions ?? []}
          profileStats={pendingActionsQuery.data?.profile_stats ?? ''}
          isLoading={pendingActionsQuery.isLoading}
        />
        <ConnectionRequests />
        <Opportunities />
      </div>
    </div>
  )
}
