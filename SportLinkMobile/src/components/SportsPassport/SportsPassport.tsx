import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { PassportEntry } from '../../types/athlete'
import { resolveLevel, resolveTournamentName } from '../../types/athlete'
import { Card } from '../ui/Card'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  entries: PassportEntry[]
  isOwner: boolean
}

const levelIcon: Record<string, string> = {
  international: '🌏',
  national: '🏅',
  state: '🏃',
  district: '📍',
}

const medalIcon: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
}

function PassportEntryRow({ entry }: { entry: PassportEntry }) {
  const level = resolveLevel(entry)
  const tournamentName = resolveTournamentName(entry)
  const medal = entry.medal && entry.medal !== 'none' ? medalIcon[entry.medal] : ''
  const pb = entry.is_personal_best === 1 ? ' · PB 🔥' : ''

  return (
    <View style={styles.entry}>
      <View style={styles.entryLeft}>
        <Text style={styles.yearText}>{entry.year}</Text>
        {level && <Text style={styles.levelIcon}>{levelIcon[level] ?? '📍'}</Text>}
      </View>
      <View style={styles.entryContent}>
        <Text style={styles.tournamentName}>{tournamentName}</Text>
        <Text style={styles.entryMeta}>
          {level ? level.charAt(0).toUpperCase() + level.slice(1) : ''}
          {medal ? ` ${medal}` : ''}
          {pb}
        </Text>
        {entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
      </View>
    </View>
  )
}

export function SportsPassport({ entries, isOwner }: Props) {
  const sorted = [...entries].sort((a, b) => b.year - a.year)

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>🛂 Sports Passport</Text>
        {isOwner && (
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {sorted.length === 0 ? (
        <Text style={styles.empty}>No passport entries yet.</Text>
      ) : (
        <View style={styles.list}>
          {sorted.map(e => <PassportEntryRow key={e.passport_id} entry={e} />)}
        </View>
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
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  empty: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  list: {
    gap: spacing.md,
  },
  entry: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryLeft: {
    alignItems: 'center',
    width: 44,
  },
  yearText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  levelIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tournamentName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  entryMeta: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  entryNotes: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
})
