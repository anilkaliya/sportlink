import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native'
import type { EducationEntry } from '../../types/athlete'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize, radii } from '../../theme'
import { athleteApi } from '../../api/athlete'
import { useAthleteStore } from '../../stores/athleteStore'

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
  const [showForm, setShowForm] = useState(false)
  const [institution, setInstitution] = useState('')
  const [degree, setDegree] = useState('')
  const [field, setField] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const athleteId = useAthleteStore(s => s.profile?.athlete_id)
  const addEducation = useAthleteStore(s => s.addEducation)

  async function handleSubmit() {
    if (!institution.trim()) {
      Alert.alert('Required', 'Institution name is required.')
      return
    }
    if (!athleteId) return
    setSubmitting(true)
    try {
      const res = await athleteApi.addEducation(athleteId, {
        institution_name: institution.trim(),
        degree: degree.trim() || undefined,
        field_of_study: field.trim() || undefined,
        start_year: startYear ? parseInt(startYear, 10) : undefined,
        end_year: endYear ? parseInt(endYear, 10) : null,
        is_current: endYear ? 0 : 1,
      })
      addEducation(res.data)
      setShowForm(false)
      setInstitution('')
      setDegree('')
      setField('')
      setStartYear('')
      setEndYear('')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add education')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>🎓 Education</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
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

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Education</Text>
            <TextInput
              style={styles.input}
              placeholder="Institution name"
              placeholderTextColor={colors.muted}
              value={institution}
              onChangeText={setInstitution}
            />
            <TextInput
              style={styles.input}
              placeholder="Degree (e.g. B.Sc)"
              placeholderTextColor={colors.muted}
              value={degree}
              onChangeText={setDegree}
            />
            <TextInput
              style={styles.input}
              placeholder="Field of study"
              placeholderTextColor={colors.muted}
              value={field}
              onChangeText={setField}
            />
            <View style={styles.yearRow}>
              <TextInput
                style={[styles.input, styles.yearInput]}
                placeholder="Start year"
                placeholderTextColor={colors.muted}
                value={startYear}
                onChangeText={setStartYear}
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, styles.yearInput]}
                placeholder="End year"
                placeholderTextColor={colors.muted}
                value={endYear}
                onChangeText={setEndYear}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  yearRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  yearInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    fontSize: fontSize.md,
    color: colors.muted,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  submitBtnText: {
    fontSize: fontSize.md,
    color: '#fff',
    fontWeight: '600',
  },
})
