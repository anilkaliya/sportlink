import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  yearsActive: number
  activeSince: number
  goldMedals: number
  timePb: string | null
  timePbEvent: string
  distancePb: string | null
  distancePbEvent: string
  nationalTitles: number
}

interface StatItem {
  icon: string
  value: string
  label: string
  sub: string
  bg: string
}

export function PerformanceSnapshot({
  yearsActive, activeSince, goldMedals, timePb,
  timePbEvent, distancePb, distancePbEvent, nationalTitles,
}: Props) {
  const stats: StatItem[] = [
    { icon: '📅', value: String(yearsActive), label: 'Years Active', sub: `Since ${activeSince}`, bg: '#dcfce7' },
    { icon: '🏆', value: String(goldMedals), label: 'Gold Medals', sub: 'Total', bg: '#fef3c7' },
    { icon: '⏱', value: timePb ?? '--', label: timePbEvent, sub: 'Personal Best', bg: '#dbeafe' },
    { icon: '📏', value: distancePb ?? '--', label: distancePbEvent, sub: 'Personal Best', bg: '#f3e8ff' },
    { icon: '🥇', value: String(nationalTitles), label: 'National Titles', sub: 'Won', bg: '#fee2e2' },
  ]

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>📊 YOUR PERFORMANCE SNAPSHOT</Text>
      </View>
      <View style={styles.statsRow}>
        {stats.map(s => (
          <View key={s.label} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Text style={styles.statIconText}>{s.icon}</Text>
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statSub}>{s.sub}</Text>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIconText: {
    fontSize: 16,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
})
