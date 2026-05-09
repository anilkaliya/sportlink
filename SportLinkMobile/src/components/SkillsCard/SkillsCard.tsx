import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native'
import type { Skill, SkillCategory } from '../../types/athlete'
import { Card } from '../ui/Card'
import { SkillTag } from '../ui/SkillTag'
import { colors, spacing, fontSize, radii } from '../../theme'
import { athleteApi } from '../../api/athlete'
import { useAthleteStore } from '../../stores/athleteStore'

interface Props {
  skills: Skill[]
  isOwner: boolean
}

export function SkillsCard({ skills, isOwner }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [category, setCategory] = useState<SkillCategory>('sport_specific')
  const [submitting, setSubmitting] = useState(false)

  const athleteId = useAthleteStore(s => s.profile?.athlete_id)
  const addSkills = useAthleteStore(s => s.addSkills)

  async function handleSubmit() {
    if (!skillName.trim()) {
      Alert.alert('Required', 'Skill name is required.')
      return
    }
    if (!athleteId) return
    setSubmitting(true)
    try {
      const res = await athleteApi.addSkills(athleteId, [{ skill_name: skillName.trim(), category }])
      addSkills(res.data)
      setShowForm(false)
      setSkillName('')
      setCategory('sport_specific')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add skill')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Skills</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
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

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Skill</Text>
            <TextInput
              style={styles.input}
              placeholder="Skill name"
              placeholderTextColor={colors.muted}
              value={skillName}
              onChangeText={setSkillName}
            />
            <View style={styles.row}>
              {(['sport_specific', 'technical', 'soft_skill', 'leadership'] as const).map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                    {c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
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
