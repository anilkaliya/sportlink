import React, { useState } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { launchImageLibrary } from 'react-native-image-picker'
import type { AthleteProfile, PassportEntry } from '../../types/athlete'
import { parseLanguages } from '../../types/athlete'
import { deriveStats, formatPb } from '../../lib/stats'
import { ConnectionButton } from '../ConnectionButton/ConnectionButton'
import { athleteApi } from '../../api/athlete'
import { messagingApi } from '../../api/messaging'
import { useAuthStore } from '../../stores/authStore'
import { useAthleteStore } from '../../stores/athleteStore'
import { colors, spacing, fontSize, radii } from '../../theme'

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

function MessageButton({ targetUserId }: { targetUserId: string }) {
  const navigation = useNavigation<any>()
  const [loading, setLoading] = useState(false)

  async function handleMessage() {
    setLoading(true)
    try {
      const res = await messagingApi.createDirectConversation(targetUserId)
      navigation.navigate('MessagesTab', {
        screen: 'Chat',
        params: { conversationId: res.data.conversation_id },
      })
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not start conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} disabled={loading}>
      <Text style={styles.messageBtnText}>{loading ? '...' : '💬 Message'}</Text>
    </TouchableOpacity>
  )
}

export function ProfileHero({ profile, passport }: Props) {
  const currentUserId = useAuthStore(s => s.userId)
  const accessToken = useAuthStore(s => s.accessToken)
  const setProfilePhoto = useAthleteStore(s => s.setProfilePhoto)
  const [uploading, setUploading] = useState(false)
  const stats = deriveStats(passport)
  const languages = parseLanguages(profile.languages)
  const headline = profile.bio?.split('—')[0]?.trim() ?? profile.bio ?? ''
  const isOwner = currentUserId != null && currentUserId === profile.user_id

  const photoUrl = profile.profile_photo_url
    ? athleteApi.getPhotoUrl(profile.athlete_id)
    : null

  async function handlePickPhoto() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    })
    if (result.didCancel || !result.assets?.[0]) return

    const asset = result.assets[0]
    if (!asset.uri) return

    setUploading(true)
    try {
      const res = await athleteApi.uploadPhoto(profile.athlete_id, {
        uri: asset.uri,
        type: asset.type ?? 'image/jpeg',
        fileName: asset.fileName ?? 'photo.jpg',
      })
      setProfilePhoto(res.data.profile_photo_url)
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload photo')
    } finally {
      setUploading(false)
    }
  }

  const pbSecLabel = stats.secondsPB ? `${stats.secondsPB.notes ?? '100m'} PB` : '100m PB'
  const pbMetLabel = stats.metersPB ? `${stats.metersPB.notes ?? 'LJ'} PB` : 'Distance PB'

  return (
    <View style={styles.hero}>
      <View style={styles.cover} />
      <View style={styles.profileMain}>
        <View style={styles.profileTop}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={isOwner ? handlePickPhoto : undefined}
            disabled={!isOwner || uploading}
            activeOpacity={isOwner ? 0.7 : 1}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : photoUrl ? (
              <Image
                source={{
                  uri: `${photoUrl}?t=${Date.now()}`,
                  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarEmoji}>🏃</Text>
            )}
            {isOwner && !uploading && (
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
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
          {!isOwner && <MessageButton targetUserId={profile.user_id} />}
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
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  cameraIcon: {
    fontSize: 12,
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
    flexDirection: 'row',
    gap: spacing.md,
  },
  messageBtn: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
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
