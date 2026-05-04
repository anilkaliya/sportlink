import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { athleteApi } from '../../api/athlete'
import { sportsApi, type Sport } from '../../api/sports'
import { useAuthStore } from '../../stores/authStore'
import type { AthleteFilters } from '../../types/athlete'
import { AthleteCard } from '../../components/AthleteCard/AthleteCard'
import { AthleteFilterBar } from '../../components/AthleteFilterBar/AthleteFilterBar'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import styles from './AthletesPage.module.css'

export function AthletesPage() {
  const currentUserId = useAuthStore(s => s.userId)
  const [filters, setFilters] = useState<AthleteFilters>({})
  const [sports, setSports] = useState<Sport[]>([])

  // Fetch sports list for filter dropdown
  useEffect(() => {
    sportsApi.getSports().then(setSports).catch(console.error)
  }, [])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['athletes', filters],
    queryFn: () => athleteApi.getAll(filters),
  })

  const athletes = data?.data ?? []

  // Build sport ID → name map for card labels
  const sportMap = new Map(sports.map(s => [s.id, s.name]))

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load athletes'} />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>DISCOVER ATHLETES</h1>
        <p className={styles.subtitle}>Browse and connect with athletes across the platform</p>
      </div>

      <AthleteFilterBar filters={filters} sports={sports} onFiltersChange={setFilters} />

      {athletes.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔍</span>
          <p className={styles.emptyText}>No athletes found matching your filters.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {athletes.map(athlete => (
            <AthleteCard
              key={athlete.athlete_id}
              athlete={athlete}
              currentUserId={currentUserId ?? ''}
              sportName={athlete.primary_sport_id ? sportMap.get(athlete.primary_sport_id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
