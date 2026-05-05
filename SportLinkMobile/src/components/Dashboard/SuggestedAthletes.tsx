import React from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Card } from '../ui/Card'
import { LevelBadge } from '../ui/LevelBadge'
import type { Suggestion } from '../../api/connections'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  athletes: Suggestion[]
  isLoading: boolean
}

export function SuggestedAthletes({ athletes, isLoading }: Props) {
  const navigation = useNavigation<any>()

  function renderAthleteCard({ item }: { item: Suggestion }) {
    return (
      <TouchableOpacity
        style={styles.athleteCard}
        onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile', params: { id: item.athlete_id } })}
      >
        <View style={styles.avatarWrap}>
          {item.profile_pic ? (
            <Image source={{ uri: item.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🏃</Text>
            </View>
          )}
        </View>
        <Text style={styles.athleteName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.athleteLocation} numberOfLines={1}>📍 {item.location}</Text>
        <LevelBadge level={item.level} />
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile', params: { id: item.athlete_id } })}
        >
          <Text style={styles.viewBtnText}>View Profile</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>👥 SUGGESTED ATHLETES</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Athletes')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <Text style={styles.emptyText}>Loading suggestions…</Text>
      ) : athletes.length === 0 ? (
        <Text style={styles.emptyText}>No suggestions yet</Text>
      ) : (
        <FlatList
          data={athletes}
          renderItem={renderAthleteCard}
          keyExtractor={item => item.athlete_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
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
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  viewAll: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  athleteCard: {
    width: 150,
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  athleteName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  athleteLocation: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  viewBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    padding: spacing.lg,
  },
})
