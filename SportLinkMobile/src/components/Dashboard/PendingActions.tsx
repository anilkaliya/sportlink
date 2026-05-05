import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Card } from '../ui/Card'
import type { PendingAction } from '../../api/athlete'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  actions: PendingAction[]
  profileStats: string
  isLoading: boolean
}

const typeIcons: Record<string, string> = {
  profile: '✅',
  requests: '👥',
  achievement: '🏅',
}

export function PendingActions({ actions, profileStats, isLoading }: Props) {
  const navigation = useNavigation<any>()

  function handlePress(type: string) {
    if (type === 'requests') navigation.navigate('Requests')
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📋</Text>
        <Text style={styles.title}>PENDING ACTIONS</Text>
        {profileStats ? <Text style={styles.percent}>{profileStats}</Text> : null}
      </View>
      <View style={styles.list}>
        {isLoading && <Text style={styles.emptyText}>Loading…</Text>}
        {!isLoading && actions.length === 0 && (
          <Text style={styles.emptyText}>All caught up!</Text>
        )}
        {actions.map(a => (
          <TouchableOpacity
            key={a.type}
            style={styles.actionItem}
            onPress={() => handlePress(a.type)}
          >
            <View style={styles.actionIcon}>
              <Text>{typeIcons[a.type] ?? '📌'}</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                {a.type === 'requests' ? a.details : 'Complete your profile'}
              </Text>
              <Text style={styles.actionSub}>{a.details}</Text>
            </View>
            {a.type === 'profile' && a.profile_stats && (
              <Text style={styles.percent}>{a.profile_stats}</Text>
            )}
            {a.type === 'requests' && <Text style={styles.arrow}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    flex: 1,
  },
  percent: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  actionSub: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 1,
  },
  arrow: {
    fontSize: 20,
    color: colors.muted,
  },
})
