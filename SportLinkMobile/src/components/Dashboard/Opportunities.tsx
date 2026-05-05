import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize } from '../../theme'

interface Opportunity {
  id: string
  title: string
  location: string
  date: string
  tag: string
  tagColor: string
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: '1', title: 'State Athletics Trials 2025', location: 'Bengaluru, Karnataka', date: '20 May 2025', tag: 'Trials', tagColor: '#0891b2' },
  { id: '2', title: 'Strength & Conditioning Workshop', location: 'Online', date: '10 Jun 2025', tag: 'Workshop', tagColor: '#16a34a' },
]

export function Opportunities() {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 OPPORTUNITIES FOR YOU</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      {MOCK_OPPORTUNITIES.map(opp => (
        <View key={opp.id} style={styles.oppItem}>
          <View style={styles.oppImage}>
            <Text style={styles.oppImageText}>🏟</Text>
          </View>
          <View style={styles.oppContent}>
            <Text style={styles.oppTitle} numberOfLines={1}>{opp.title}</Text>
            <Text style={styles.oppLocation}>{opp.location}</Text>
            <View style={[styles.oppTag, { backgroundColor: opp.tagColor + '20' }]}>
              <Text style={[styles.oppTagText, { color: opp.tagColor }]}>{opp.tag}</Text>
            </View>
          </View>
          <Text style={styles.oppDate}>{opp.date}</Text>
        </View>
      ))}
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
  oppItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  oppImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oppImageText: {
    fontSize: 20,
  },
  oppContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  oppTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  oppLocation: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 1,
  },
  oppTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: spacing.xs,
  },
  oppTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  oppDate: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
})
