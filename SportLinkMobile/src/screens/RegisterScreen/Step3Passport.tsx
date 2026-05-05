import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { Tournament } from '../../api/sports'
import { athleteApi } from '../../api/athlete'
import { useAuthStore } from '../../stores/authStore'
import { useAthleteStore } from '../../stores/athleteStore'
import { setAccessTokenInStorage, setAthleteIdInStorage } from '../../lib/auth'
import { colors, spacing, fontSize } from '../../theme'

export interface Step3Data {
  tournament: string
  customTournamentName: string
  discipline: string
  year: string
  venue: string
  level: string
  medal: string
  result: string
  position: string
}

interface Props {
  data: Step3Data
  tournaments: Tournament[]
  athleteId: string
  sportId: string
  onBack: () => void
}

type Level = 'international' | 'national' | 'state' | 'district'
type Medal = 'gold' | 'silver' | 'bronze' | 'none'

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'international', label: 'International', desc: 'Olympics, CWG, Asian Games…' },
  { value: 'national', label: 'National', desc: 'Khelo India, Nationals…' },
  { value: 'state', label: 'State', desc: 'State championships' },
  { value: 'district', label: 'District', desc: 'District / inter-school' },
]

const MEDALS: { value: Medal; icon: string; label: string }[] = [
  { value: 'gold', icon: '🥇', label: 'Gold' },
  { value: 'silver', icon: '🥈', label: 'Silver' },
  { value: 'bronze', icon: '🥉', label: 'Bronze' },
  { value: 'none', icon: '🏅', label: 'Participated' },
]

export function Step3Passport({ data, tournaments, athleteId, sportId, onBack }: Props) {
  const navigation = useNavigation<any>()
  const setAuthenticated = useAuthStore(s => s.setAuthenticated)
  const setAthleteId = useAthleteStore(s => s.setAthleteId)

  const [form, setForm] = useState<Step3Data>(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showCustom = form.tournament === 'custom'

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      await athleteApi.addPassportEntry(athleteId, {
        sport_id: sportId,
        ...(showCustom
          ? { tournament_name_override: form.customTournamentName, level_override: form.level as Level }
          : { tournament_id: form.tournament }),
        year: Number(form.year),
        ...(form.medal ? { medal: form.medal as Medal } : {}),
        ...(form.discipline ? { notes: form.discipline } : {}),
      })
      // Mark authenticated and navigate to main
      setAuthenticated(true)
      setAthleteId(athleteId)
      await setAthleteIdInStorage(athleteId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save passport entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTag}>Step 3 — Sports Passport</Text>
        <Text style={styles.heading}>BEST ACHIEVEMENT</Text>
        <Text style={styles.sub}>Add your biggest tournament result.</Text>

        <Text style={styles.section}>Tournament</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tournamentScroll}>
          {tournaments.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tournamentPill, form.tournament === t.id && styles.tournamentPillActive]}
              onPress={() => setForm(p => ({ ...p, tournament: t.id }))}
            >
              <Text style={[styles.tournamentText, form.tournament === t.id && styles.tournamentTextActive]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.tournamentPill, form.tournament === 'custom' && styles.tournamentPillActive]}
            onPress={() => setForm(p => ({ ...p, tournament: 'custom' }))}
          >
            <Text style={[styles.tournamentText, form.tournament === 'custom' && styles.tournamentTextActive]}>
              Other…
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {showCustom && (
          <View style={styles.field}>
            <Text style={styles.label}>Tournament name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. State Junior Championship"
              placeholderTextColor={colors.regMuted}
              value={form.customTournamentName}
              onChangeText={v => setForm(p => ({ ...p, customTournamentName: v }))}
            />
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Event / Discipline *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100m Sprint"
              placeholderTextColor={colors.regMuted}
              value={form.discipline}
              onChangeText={v => setForm(p => ({ ...p, discipline: v }))}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="2024"
              placeholderTextColor={colors.regMuted}
              value={form.year}
              onChangeText={v => setForm(p => ({ ...p, year: v }))}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.section}>Level</Text>
        <View style={styles.levelGrid}>
          {LEVELS.map(lv => (
            <TouchableOpacity
              key={lv.value}
              style={[styles.levelOpt, form.level === lv.value && styles.levelOptActive]}
              onPress={() => setForm(p => ({ ...p, level: lv.value }))}
            >
              <Text style={[styles.levelName, form.level === lv.value && styles.levelNameActive]}>
                {lv.label}
              </Text>
              <Text style={styles.levelDesc}>{lv.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Medal / Result</Text>
        <View style={styles.medalGrid}>
          {MEDALS.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.medalOpt, form.medal === m.value && styles.medalOptActive]}
              onPress={() => setForm(p => ({ ...p, medal: m.value }))}
            >
              <Text style={styles.medalIcon}>{m.icon}</Text>
              <Text style={styles.medalName}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Saving…' : 'Create My Profile 🎽'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack} disabled={loading} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  stepTag: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.regInk,
    letterSpacing: 1,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.regMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  section: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.regInk,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  tournamentScroll: {
    marginBottom: spacing.lg,
  },
  tournamentPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.regBorder,
    marginRight: spacing.sm,
  },
  tournamentPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tournamentText: {
    fontSize: fontSize.sm,
    color: colors.regMuted,
  },
  tournamentTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.regInk,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.regSurface,
    borderWidth: 1,
    borderColor: colors.regBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.regInk,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  levelGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  levelOpt: {
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.regBorder,
  },
  levelOptActive: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent,
  },
  levelName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.regInk,
  },
  levelNameActive: {
    color: colors.accent,
  },
  levelDesc: {
    fontSize: fontSize.xs,
    color: colors.regMuted,
    marginTop: 2,
  },
  medalGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  medalOpt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.regBorder,
  },
  medalOptActive: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent,
  },
  medalIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  medalName: {
    fontSize: fontSize.xs,
    color: colors.regInk,
    fontWeight: '500',
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.regError,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.regAccent,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.regInk,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.regMuted,
  },
})
