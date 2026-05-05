import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { spacing, fontSize } from '../../theme'

const levelColors: Record<string, { bg: string; text: string }> = {
  international: { bg: '#dcfce7', text: '#166534' },
  national: { bg: '#dbeafe', text: '#1e40af' },
  state: { bg: '#fef3c7', text: '#92400e' },
  district: { bg: '#f3e8ff', text: '#6b21a8' },
}

interface Props {
  level: string
}

export function LevelBadge({ level }: Props) {
  const colorSet = levelColors[level.toLowerCase()] ?? levelColors.district
  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
      <Text style={[styles.text, { color: colorSet.text }]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
})
