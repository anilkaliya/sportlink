import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing, fontSize } from '../theme'

export function ForgotPasswordScreen() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>FORGOT PASSWORD</Text>
        <Text style={styles.sub}>Enter your email and we'll send you a reset link.</Text>

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
          />
        </View>

        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.regBg,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  back: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xxl,
  },
  field: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
  btn: {
    backgroundColor: colors.regAccent,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  btnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.regInk,
  },
})
