import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { userApi } from '../../api/user'
import { useAuthStore } from '../../stores/authStore'
import { setAccessTokenInStorage, setUserIdInStorage } from '../../lib/auth'
import { colors, spacing, fontSize } from '../../theme'

export interface Step1Data {
  email: string
  phone: string
  password: string
  termsAccepted: boolean
  userId: string
}

interface Props {
  data: Step1Data
  onNext: (data: Step1Data) => void
}

function calcStrength(val: string): number {
  if (!val) return 0
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  return score
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = [colors.regMuted, colors.regError, colors.gold, colors.regSuccess, colors.regSuccess]

export function Step1Account({ data, onNext }: Props) {
  const setAccessToken = useAuthStore(s => s.setAccessToken)
  const setUserId = useAuthStore(s => s.setUserId)

  const [form, setForm] = useState<Step1Data>(data)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = calcStrength(form.password)

  async function handleContinue() {
    setError(null)
    setLoading(true)
    try {
      const res = await userApi.register({
        email: form.email,
        mobile_number: form.phone,
        password: form.password,
      })

      // Register doesn't return a token. Log in immediately so the
      // authenticated calls in steps 2 and 3 carry a Bearer token. We set the
      // token but NOT isAuthenticated, so the wizard stays in the Auth stack
      // until step 3 completes the profile.
      const loginRes = await userApi.login({ email: form.email, password: form.password })
      setAccessToken(loginRes.accessToken)
      setUserId(loginRes.data.user_id)
      await setAccessTokenInStorage(loginRes.accessToken)
      await setUserIdInStorage(loginRes.data.user_id)

      onNext({ ...form, userId: loginRes.data.user_id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTag}>Step 1 — Account</Text>
        <Text style={styles.heading}>CREATE ACCOUNT</Text>
        <Text style={styles.sub}>Takes 60 seconds. No credit card needed.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email address *</Text>
          <TextInput
            style={styles.input}
            placeholder="yourname@email.com"
            placeholderTextColor={colors.regMuted}
            value={form.email}
            onChangeText={v => setForm(p => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mobile number *</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phoneCode}>
              <Text style={styles.phoneCodeText}>+91</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="98765 43210"
              placeholderTextColor={colors.regMuted}
              value={form.phone}
              onChangeText={v => setForm(p => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.pwWrap}>
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.regMuted}
              value={form.password}
              onChangeText={v => setForm(p => ({ ...p, password: v }))}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.pwToggle} onPress={() => setShowPw(v => !v)}>
              <Text>{showPw ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {form.password.length > 0 && (
            <View style={styles.strengthRow}>
              {[0, 1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[styles.strengthBar, i < strength && { backgroundColor: STRENGTH_COLOR[strength] }]}
                />
              ))}
              <Text style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
                {STRENGTH_LABEL[strength]}
              </Text>
            </View>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Continue →'}</Text>
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
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCode: {
    backgroundColor: colors.regSurface,
    borderWidth: 1,
    borderColor: colors.regBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  phoneCodeText: {
    fontSize: fontSize.md,
    color: colors.regInk,
  },
  phoneInput: {
    flex: 1,
  },
  pwWrap: {
    position: 'relative',
  },
  pwToggle: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    backgroundColor: colors.regBorder,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginLeft: spacing.sm,
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
    marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.regInk,
  },
})
