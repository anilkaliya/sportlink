import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { userApi } from '../api/user'
import { useAuthStore } from '../stores/authStore'
import { useAthleteStore } from '../stores/athleteStore'
import { setAccessTokenInStorage, setUserIdInStorage, setAthleteIdInStorage } from '../lib/auth'
import { colors, spacing, fontSize } from '../theme'
import type { AuthScreenProps } from '../navigation/types'

export function SignInScreen() {
  const navigation = useNavigation<AuthScreenProps<'SignIn'>['navigation']>()
  const setAuthenticated = useAuthStore(s => s.setAuthenticated)
  const setAccessToken = useAuthStore(s => s.setAccessToken)
  const setUserId = useAuthStore(s => s.setUserId)
  const setAthleteId = useAthleteStore(s => s.setAthleteId)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    setLoading(true)
    try {
      const res = await userApi.login({ email, password })
      const { user_id, athlete_id } = res.data

      setAuthenticated(true)
      setAccessToken(res.accessToken)
      setUserId(user_id)
      await setAccessTokenInStorage(res.accessToken)
      await setUserIdInStorage(user_id)

      if (athlete_id) {
        setAthleteId(athlete_id)
        await setAthleteIdInStorage(athlete_id)
      } else {
        navigation.navigate('Register', { step: 2 })
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topSection}>
            <Text style={styles.logo}>
              <Text style={styles.logoAccent}>SPORT</Text>LINK
            </Text>
            <Text style={styles.heading}>WELCOME BACK</Text>
            <Text style={styles.sub}>Enter your credentials to access your profile.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, styles.pwInput]}
                  placeholder="Your password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.pwToggle} onPress={() => setShowPw(v => !v)}>
                  <Text>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In →'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerAccent}>Join SportLink</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.regBg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  topSection: {
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  logoAccent: {
    color: colors.accent,
  },
  heading: {
    fontSize: fontSize.display,
    fontWeight: '700',
    color: colors.regInk,
    letterSpacing: 2,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.regMuted,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.regInk,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  pwWrap: {
    position: 'relative',
  },
  pwInput: {
    paddingRight: 50,
  },
  pwToggle: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.regError,
    marginTop: -spacing.sm,
  },
  btn: {
    backgroundColor: colors.regAccent,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.regInk,
  },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.regBorder,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.regMuted,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: fontSize.sm,
    color: colors.regMuted,
  },
  registerAccent: {
    color: colors.accent,
    fontWeight: '600',
  },
})
