import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import type { AthleteProfile, PassportEntry } from '../../types/athlete'
import { parseLanguages } from '../../types/athlete'
import { deriveStats, formatPb } from '../../lib/stats'
import { ConnectionButton } from '../ConnectionButton/ConnectionButton'
import { useAuthStore } from '../../stores/authStore'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  profile: AthleteProfile
  passport: PassportEntry[]
}

function StatCell({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export function ProfileHero({ profile, passport }: Props) {
  const currentUserId = useAuthStore(s => s.userId)
  const stats = deriveStats(passport)
  const languages = parseLanguages(profile.languages)
  const headline = profile.bio?.split('—')[0]?.trim() ?? profile.bio ?? ''

  const pbSecLabel = stats.secondsPB ? `${stats.secondsPB.notes ?? '100m'} PB` : '100m PB'
  const pbMetLabel = stats.metersPB ? `${stats.metersPB.notes ?? 'LJ'} PB` : 'Distance PB'

  return (
    <View style={styles.hero}>
      <View style={styles.cover} />
      <View style={styles.profileMain}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            {profile.profile_photo_url ? (
              <Image source={{ uri: profile.profile_photo_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarEmoji}>🏃</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.full_name}</Text>
            {headline ? <Text style={styles.sport}>⚡ {headline}</Text> : null}
            <Text style={styles.meta}>
              {profile.city && profile.state && `📍 ${profile.city}, ${profile.state}`}
              {languages.length > 0 && ` · 🗣 ${languages.join(', ')}`}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <ConnectionButton targetUserId={profile.user_id} currentUserId={currentUserId ?? ''} />
        </View>
        <View style={styles.statsRow}>
          <StatCell value={`${stats.yearsActive}`} label="Years Active" color={colors.accent} />
          <StatCell value={`${stats.goldMedals}`} label="Gold Medals" color={colors.gold} />
          <StatCell value={formatPb(stats.secondsPB?.pb_value, stats.secondsPB?.pb_unit)} label={pbSecLabel} color={colors.accent} />
          <StatCell value={formatPb(stats.metersPB?.pb_value, stats.metersPB?.pb_unit)} label={pbMetLabel} color={colors.accent3} />
          <StatCell value={`${stats.nationalTitles}`} label="Nat. Titles" color={colors.accent} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cover: {
    height: 120,
    backgroundColor: colors.darkBg,
  },
  profileMain: {
    padding: spacing.lg,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginTop: 44,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  sport: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
  actions: {
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statCell: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
})
