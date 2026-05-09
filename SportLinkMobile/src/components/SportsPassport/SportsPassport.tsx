import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native'
import type { PassportEntry } from '../../types/athlete'
import { resolveLevel, resolveTournamentName } from '../../types/athlete'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize, radii } from '../../theme'
import { athleteApi } from '../../api/athlete'
import { useAthleteStore } from '../../stores/athleteStore'

interface Props {
  entries: PassportEntry[]
  isOwner: boolean
}

const levelIcon: Record<string, string> = {
  international: '🌏',
  national: '🏅',
  state: '🏃',
  district: '📍',
}

const medalIcon: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
}

function PassportEntryRow({ entry }: { entry: PassportEntry }) {
  const level = resolveLevel(entry)
  const tournamentName = resolveTournamentName(entry)
  const medal = entry.medal && entry.medal !== 'none' ? medalIcon[entry.medal] : ''
  const pb = entry.is_personal_best === 1 ? ' · PB 🔥' : ''

  return (
    <View style={styles.entry}>
      <View style={styles.entryLeft}>
        <Text style={styles.yearText}>{entry.year}</Text>
        {level && <Text style={styles.levelIcon}>{levelIcon[level] ?? '📍'}</Text>}
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.tournamentName}>{tournamentName}</Text>
        <Text style={styles.entryMeta}>
          {level ? level.charAt(0).toUpperCase() + level.slice(1) : ''}
          {medal ? ` ${medal}` : ''}
          {pb}
        </Text>
        {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
      </View>
    </View>
  )
}

export function SportsPassport({ entries, isOwner }: Props) {
  const sorted = [...entries].sort((a, b) => b.year - a.year)
  const [showForm, setShowForm] = useState(false)
  const [tournamentName, setTournamentName] = useState('')
  const [year, setYear] = useState('')
  const [level, setLevel] = useState<'international' | 'national' | 'state' | 'district'>('state')
  const [medal, setMedal] = useState<'gold' | 'silver' | 'bronze' | 'none'>('none')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const athleteId = useAthleteStore(s => s.profile?.athlete_id)
  const sportId = useAthleteStore(s => s.profile?.primary_sport_id)
  const addPassportEntry = useAthleteStore(s => s.addPassportEntry)

  async function handleSubmit() {
    if (!tournamentName.trim() || !year.trim()) {
      Alert.alert('Required', 'Tournament name and year are required.')
      return
    }
    if (!athleteId || !sportId) return
    setSubmitting(true)
    try {
      const res = await athleteApi.addPassportEntry(athleteId, {
        sport_id: sportId,
        tournament_name_override: tournamentName.trim(),
        level_override: level,
        year: parseInt(year, 10),
        medal,
        notes: notes.trim() || undefined,
      })
      addPassportEntry(res.data)
      setShowForm(false)
      setTournamentName('')
      setYear('')
      setLevel('state')
      setMedal('none')
      setNotes('')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>🛂 Sports Passport</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {sorted.length === 0 ? (
        <Text style={styles.empty}>No passport entries yet.</Text>
      ) : (
        <View style={styles.list}>
          {sorted.map(e => <PassportEntryRow key={e.passport_id} entry={e} />)}
        </View>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Passport Entry</Text>
            <TextInput
              style={styles.input}
              placeholder="Tournament Name"
              placeholderTextColor={colors.muted}
              value={tournamentName}
              onChangeText={setTournamentName}
            />
            <TextInput
              style={styles.input}
              placeholder="Year (e.g. 2024)"
              placeholderTextColor={colors.muted}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
            <View style={styles.row}>
              {(['district', 'state', 'national', 'international'] as const).map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.chip, level === l && styles.chipActive]}
                  onPress={() => setLevel(l)}
                >
                  <Text style={[styles.chipText, level === l && styles.chipTextActive]}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.row}>
              {(['none', 'gold', 'silver', 'bronze'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, medal === m && styles.chipActive]}
                  onPress={() => setMedal(m)}
                >
                  <Text style={[styles.chipText, medal === m && styles.chipTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
            />
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
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryLeft: {
    alignItems: 'center',
    width: 44,
  },
  yearText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  levelIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tournamentName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  entryMeta: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  entryNotes: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
    fontStyle: 'italic',
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
