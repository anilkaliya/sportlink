import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize } from '../../theme'

interface ActivityItem {
  id: string
  icon: string
  text: string
  time: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: '🏆', text: 'Rahul Sharma won Gold in 400m at State Championship', time: '2 days ago' },
  { id: '2', icon: '🏃', text: 'Neha Reddy achieved a new 100m PB - 11.48s', time: '3 days ago' },
  { id: '3', icon: '👤', text: 'Vikram Singh sent you a connection request', time: '5 days ago' },
]

export function RecentActivity() {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ RECENT ACTIVITY</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      <View style={styles.list}>
        {MOCK_ACTIVITY.map(item => (
          <View key={item.id} style={styles.activityItem}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.activityText} numberOfLines={2}>{item.text}</Text>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  viewAll: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
})
