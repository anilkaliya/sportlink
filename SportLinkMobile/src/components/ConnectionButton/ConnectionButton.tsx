import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { useConnectionActions } from '../../hooks/useConnectionActions'
import { colors, spacing, fontSize } from '../../theme'

interface Props {
  targetUserId: string
  currentUserId: string
}

export function ConnectionButton({ targetUserId, currentUserId }: Props) {
  if (targetUserId === currentUserId) return null

  const { status: fetchedStatus, requestId, isLoading, refetch } = useConnectionStatus(targetUserId)
  const { optimisticStatus, isMutating, sendRequest, acceptRequest, rejectRequest, cancelRequest } =
    useConnectionActions(fetchedStatus, refetch)

  const status = optimisticStatus ?? fetchedStatus

  if (isLoading) {
    return (
      <TouchableOpacity style={styles.btnPending} disabled>
        <Text style={styles.btnPendingText}>···</Text>
      </TouchableOpacity>
    )
  }

  if (status === 'none') {
    return (
      <TouchableOpacity
        style={styles.btnConnect}
        disabled={isMutating}
        onPress={() => sendRequest(targetUserId)}
      >
        <Text style={styles.btnConnectText}>Connect</Text>
      </TouchableOpacity>
    )
  }

  if (status === 'pending_outgoing') {
    return (
      <TouchableOpacity
        style={styles.btnPending}
        disabled={isMutating}
        onPress={() => requestId !== null && cancelRequest(requestId)}
      >
        <Text style={styles.btnPendingText}>Pending</Text>
      </TouchableOpacity>
    )
  }

  if (status === 'pending_incoming') {
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btnAccept}
          disabled={isMutating}
          onPress={() => requestId !== null && acceptRequest(requestId)}
        >
          <Text style={styles.btnAcceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnOutline}
          disabled={isMutating}
          onPress={() => requestId !== null && rejectRequest(requestId)}
        >
          <Text style={styles.btnOutlineText}>Reject</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // connected
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btnConnected} disabled>
        <Text style={styles.btnConnectedText}>Connected</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnOutline}>
        <Text style={styles.btnOutlineText}>Message</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
  },
  btnConnect: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  btnConnectText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  btnPending: {
    alignSelf: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  btnPendingText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  btnAccept: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  btnAcceptText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  btnOutlineText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  btnConnected: {
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  btnConnectedText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
})
