import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { AthleteListItem } from '../../types/athlete'
import { ConnectionButton } from '../ConnectionButton/ConnectionButton'
import { colors, spacing, fontSize, radii } from '../../theme'

interface Props {
  athlete: AthleteListItem
  currentUserId: string
  sportName?: string
}

export function AthleteCard({ athlete, currentUserId, sportName }: Props) {
  const navigation = useNavigation<any>()
  const location = [athlete.city, athlete.state].filter(Boolean).join(', ')
  const displaySport = sportName ?? athlete.sport_name

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.top}
        onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile', params: { id: athlete.athlete_id } })}
      >
        <View style={styles.avatar}>
          {athlete.profile_photo_url ? (
            <Image source={{ uri: athlete.profile_photo_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarEmoji}>🏃</Text>
          )}
        </View>
        <Text style={styles.name}>{athlete.full_name}</Text>
        {displaySport && <Text style={styles.sport}>{displaySport}</Text>}
        {location ? <Text style={styles.location}>📍 {location}</Text> : null}
      </TouchableOpacity>
      <View style={styles.actions}>
        <ConnectionButton targetUserId={athlete.user_id} currentUserId={currentUserId} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  top: {
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  sport: {
    fontSize: fontSize.sm,
    color: colors.accent,
    marginTop: 2,
  },
  location: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
  },
  actions: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
})
