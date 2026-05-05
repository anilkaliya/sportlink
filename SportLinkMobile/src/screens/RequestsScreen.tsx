import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useIncomingRequests } from '../hooks/useIncomingRequests'
import { RequestCard } from '../components/RequestCard/RequestCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import type { ConnectionRequest } from '../types/athlete'
import { colors, spacing, fontSize } from '../theme'

export function RequestsScreen() {
  const { requests, isLoading, isError, error } = useIncomingRequests()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error?.message ?? 'Failed to load requests'} />

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>CONNECTION REQUESTS</Text>
        <Text style={styles.subtitle}>Athletes who want to connect with you</Text>
      </View>
      {requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptyText}>When other athletes connect with you, they'll show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={({ item }: { item: ConnectionRequest }) => <RequestCard request={item} />}
          keyExtractor={item => item.request_id}
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
  list: {
    padding: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
})
