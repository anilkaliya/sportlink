import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { EducationEntry } from '../../types/athlete'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  education: EducationEntry[]
  isOwner: boolean
}

function EduEntry({ entry }: { entry: EducationEntry }) {
  const years = `${entry.start_year ?? '?'}–${entry.end_year ?? 'Present'}`
  const degreeField = [entry.degree, entry.field_of_study].filter(Boolean).join(' · ')

  return (
    <View style={styles.entry}>
      <Text style={styles.entryDegree}>{degreeField || 'Education'}</Text>
      <Text style={styles.entryInstitution}>{entry.institution_name}</Text>
      <Text style={styles.entryYears}>{years}</Text>
    </View>
  )
}

export function EducationCard({ education, isOwner }: Props) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>🎓 Education</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {education.length === 0 ? (
        <Text style={styles.empty}>No education entries yet.</Text>
      ) : (
        <View style={styles.list}>
          {education.map(e => <EduEntry key={e.education_id} entry={e} />)}
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
  list: {
    gap: spacing.md,
  },
  entry: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryDegree: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  entryInstitution: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  entryYears: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
})
