import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, spacing, radii } from '../../theme'

interface Props {
  children: React.ReactNode
}

export function Card({ children }: Props) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
})
