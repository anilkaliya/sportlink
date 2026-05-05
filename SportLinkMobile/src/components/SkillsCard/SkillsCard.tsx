import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Skill } from '../../types/athlete'
import { Card } from '../ui/Card'
import { SkillTag } from '../ui/SkillTag'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  skills: Skill[]
  isOwner: boolean
}

export function SkillsCard({ skills, isOwner }: Props) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Skills</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {skills.length === 0 ? (
        <Text style={styles.empty}>No skills listed yet.</Text>
      ) : (
        <View style={styles.tags}>
          {skills.map(s => <SkillTag key={s.skill_id} skill={s} />)}
        </View>
      )}
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
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
