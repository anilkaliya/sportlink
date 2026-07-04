import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useAuthStore } from '../../stores/authStore'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  name: string
  location: string
  sport: string
  profileStrength: number
  photoUrl: string | null
}

export function WelcomeBanner({ name, location, sport, profileStrength, photoUrl }: Props) {
  const firstName = name.split(' ')[0]
  const accessToken = useAuthStore(s => s.accessToken)

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          {photoUrl ? (
            <Image
              source={{
                uri: photoUrl,
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
              }}
              style={styles.avatarImg}
            />
          ) : (
            <Text style={styles.avatarEmoji}>🏃</Text>
          )}
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.greeting}>Welcome back, {firstName}!</Text>
          <Text style={styles.subtitle}>Keep connecting, keep improving.</Text>
          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>📍 {location}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>🏃 {sport}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>📊 Profile: {profileStrength}%</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.darkBg,
    borderRadius: 16,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  textBlock: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
})
