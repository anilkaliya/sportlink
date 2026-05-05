import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../ui/Card'
import { connectionsApi } from '../../api/connections'
import type { ConnectionRequest } from '../../types/athlete'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  requests: ConnectionRequest[]
  isLoading: boolean
}

export function ConnectionRequests({ requests, isLoading }: Props) {
  const navigation = useNavigation<any>()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['connection-requests'] })
    queryClient.invalidateQueries({ queryKey: ['requests', 'incoming'] })
    queryClient.invalidateQueries({ queryKey: ['pending-actions'] })
  }

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => connectionsApi.acceptRequest(requestId),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => connectionsApi.rejectRequest(requestId),
    onSuccess: invalidate,
  })

  const isBusy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>🤝 CONNECTION REQUESTS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {isLoading && <Text style={styles.empty}>Loading…</Text>}
        {!isLoading && requests.length === 0 && (
          <Text style={styles.empty}>No pending requests.</Text>
        )}
        {requests.map(r => (
          <View key={r.request_id} style={styles.requestItem}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>Athlete</Text>
              <Text style={styles.detail}>Connection request</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                disabled={isBusy}
                onPress={() => acceptMutation.mutate(r.request_id)}
              >
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ignoreBtn}
                disabled={isBusy}
                onPress={() => rejectMutation.mutate(r.request_id)}
              >
                <Text style={styles.ignoreBtnText}>Ignore</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
  empty: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  acceptBtnText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  ignoreBtn: {
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  ignoreBtnText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
})
