import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionsApi } from '../../api/connections'
import type { ConnectionRequest } from '../../types/athlete'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  request: ConnectionRequest
}

export function RequestCard({ request }: Props) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['requests', 'incoming'] })
    queryClient.invalidateQueries({ queryKey: ['connection-requests'] })
    queryClient.invalidateQueries({ queryKey: ['pending-actions'] })
  }

  const acceptMutation = useMutation({
    mutationFn: () => connectionsApi.acceptRequest(request.request_id),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: () => connectionsApi.rejectRequest(request.request_id),
    onSuccess: invalidate,
  })

  const isBusy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>Athlete</Text>
        <Text style={styles.detail}>Wants to connect with you</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          disabled={isBusy}
          onPress={() => acceptMutation.mutate()}
        >
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          disabled={isBusy}
          onPress={() => rejectMutation.mutate()}
        >
          <Text style={styles.rejectBtnText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  rejectBtn: {
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
