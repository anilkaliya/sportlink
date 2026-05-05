import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { athleteApi } from '../api/athlete'
import { sportsApi, type Sport } from '../api/sports'
import { useAuthStore } from '../stores/authStore'
import type { AthleteFilters, AthleteListItem } from '../types/athlete'
import { AthleteCard } from '../components/AthleteCard/AthleteCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { colors, spacing, fontSize } from '../theme'

export function AthletesScreen() {
  const currentUserId = useAuthStore(s => s.userId)
  const [filters, setFilters] = useState<AthleteFilters>({})
  const [searchText, setSearchText] = useState('')
  const [sports, setSports] = useState<Sport[]>([])

  useEffect(() => {
    sportsApi.getSports().then(setSports).catch(console.error)
  }, [])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['athletes', filters],
    queryFn: () => athleteApi.getAll(filters),
  })

  const athletes = data?.data ?? []
  const sportMap = new Map(sports.map(s => [s.id, s.name]))

  function handleSearch(text: string) {
    setSearchText(text)
    setFilters(prev => ({ ...prev, search: text || undefined }))
  }

  const paddedAthletes = athletes.length % 2 !== 0
    ? [...athletes, null]
    : athletes

  function renderItem({ item }: { item: AthleteListItem | null }) {
    if (!item) return <View style={{ flex: 1 }} />
    return (
      <AthleteCard
        athlete={item}
        currentUserId={currentUserId ?? ''}
        sportName={item.sport_name ?? (item.primary_sport_id ? sportMap.get(item.primary_sport_id) : undefined)}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>DISCOVER ATHLETES</Text>
        <Text style={styles.subtitle}>Browse and connect with athletes</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search athletes..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load athletes'} />
      ) : athletes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No athletes found matching your filters.</Text>
        </View>
      ) : (
        <FlatList
          data={paddedAthletes}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.athlete_id ?? `empty-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    gap: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
  },
})
