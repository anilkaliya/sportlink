import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Skill } from '../../types/athlete'
import { colors, spacing, fontSize } from '../../theme'

const categoryEmoji: Record<string, string> = {
  sport_specific: '🏃',
  soft_skill: '🤝',
  technical: '📊',
  leadership: '🎯',
}

interface Props {
  skill: Skill
}

export function SkillTag({ skill }: Props) {
  return (
    <View style={styles.tag}>
      <Text style={styles.emoji}>{categoryEmoji[skill.category] ?? '⚡'}</Text>
      <Text style={styles.name}>{skill.skill_name}</Text>
      {skill.endorsement_count > 0 && (
        <Text style={styles.endorsement}>+{skill.endorsement_count}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  name: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  endorsement: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },
})
