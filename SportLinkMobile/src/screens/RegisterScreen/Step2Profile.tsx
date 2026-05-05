import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import type { Sport } from '../../api/sports'
import { athleteApi } from '../../api/athlete'
import { colors, spacing, fontSize } from '../../theme'

export interface Step2Data {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  city: string
  state: string
  primarySport: string
  isStillCompeting: boolean
  languages: string[]
  athleteId: string
}

interface Props {
  data: Step2Data
  sports: Sport[]
  userId: string
  onNext: (data: Step2Data) => void
  onBack: () => void
}

const LANGUAGES = ['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati', 'Malayalam']

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'West Bengal',
]

export function Step2Profile({ data, sports, userId, onNext, onBack }: Props) {
  const [form, setForm] = useState<Step2Data>(data)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleLang(lang: string) {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  async function handleContinue() {
    setError(null)
    setLoading(true)
    try {
      const res = await athleteApi.create({
        user_id: userId,
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: form.dateOfBirth,
        gender: form.gender,
        city: form.city,
        state: form.state,
        country: 'India',
        primary_sport_id: form.primarySport,
        languages: form.languages.join(','),
      })
      onNext({ ...form, athleteId: res.data.athlete_id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTag}>Step 2 — Athlete Profile</Text>
        <Text style={styles.heading}>WHO ARE YOU?</Text>
        <Text style={styles.sub}>Your public profile. Visible to recruiters and scouts.</Text>

        <Text style={styles.section}>Personal</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Priya"
              placeholderTextColor={colors.regMuted}
              value={form.firstName}
              onChangeText={v => setForm(p => ({ ...p, firstName: v }))}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Last name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Sharma"
              placeholderTextColor={colors.regMuted}
              value={form.lastName}
              onChangeText={v => setForm(p => ({ ...p, lastName: v }))}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Date of birth *</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.regMuted}
              value={form.dateOfBirth}
              onChangeText={v => setForm(p => ({ ...p, dateOfBirth: v }))}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              {['male', 'female', 'other'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                  onPress={() => setForm(p => ({ ...p, gender: g }))}
                >
                  <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.section}>Location</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="Bengaluru"
              placeholderTextColor={colors.regMuted}
              value={form.city}
              onChangeText={v => setForm(p => ({ ...p, city: v }))}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="Karnataka"
              placeholderTextColor={colors.regMuted}
              value={form.state}
              onChangeText={v => setForm(p => ({ ...p, state: v }))}
            />
          </View>
        </View>

        <Text style={styles.section}>Sport</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Primary sport *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportScroll}>
            {sports.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sportPill, form.primarySport === s.id && styles.sportPillActive]}
                onPress={() => setForm(p => ({ ...p, primarySport: s.id }))}
              >
                <Text style={[styles.sportPillText, form.primarySport === s.id && styles.sportPillTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.section}>Languages</Text>
        <View style={styles.langGrid}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.langPill, form.languages.includes(lang) && styles.langPillActive]}
              onPress={() => toggleLang(lang)}
            >
              <Text style={[styles.langPillText, form.languages.includes(lang) && styles.langPillTextActive]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Saving profile…' : 'Continue →'}</Text>
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
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
    marginBottom: spacing.md,
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
  genderRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.regBorder,
  },
  genderBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  genderText: {
    fontSize: fontSize.xs,
    color: colors.regMuted,
  },
  genderTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sportScroll: {
    marginBottom: spacing.sm,
  },
  sportPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.regBorder,
    marginRight: spacing.sm,
  },
  sportPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sportPillText: {
    fontSize: fontSize.sm,
    color: colors.regMuted,
  },
  sportPillTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  langPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.regBorder,
  },
  langPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  langPillText: {
    fontSize: fontSize.sm,
    color: colors.regMuted,
  },
  langPillTextActive: {
    color: colors.white,
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
