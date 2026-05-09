import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { connectionsApi, ConnectedAthlete } from '../api/connections'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { colors, spacing, fontSize, radii } from '../theme'

function ConnectionCard({ item }: { item: ConnectedAthlete }) {
  const navigation = useNavigation<any>()

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('ProfileTab', {
          screen: 'Profile',
          params: { id: item.athlete_id },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>🏃</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.user_name}
      </Text>
      <Text style={styles.location} numberOfLines={1}>
        📍 {item.location}
      </Text>
      <View style={styles.sportBadge}>
        <Text style={styles.sportBadgeText}>{item.primary_sport}</Text>
      </View>
      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() =>
          navigation.navigate('ProfileTab', {
            screen: 'Profile',
            params: { id: item.athlete_id },
          })
        }
      >
        <Text style={styles.viewBtnText}>View Profile</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export function ConnectionsScreen() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.getConnections(),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError)
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load connections'}
      />
    )

  const connections = data ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>My Connections</Text>
        <Text style={styles.headerCount}>{connections.length}</Text>
      </View>
      {connections.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🤝</Text>
          <Text style={styles.emptyTitle}>No connections yet</Text>
          <Text style={styles.emptySubtitle}>
            Start connecting with athletes to build your network
          </Text>
        </View>
      ) : (
        <FlatList
          data={connections}
          renderItem={({ item }) => <ConnectionCard item={item} />}
          keyExtractor={item => item.athlete_id}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerCount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  location: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  sportBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  sportBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
  viewBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
})
