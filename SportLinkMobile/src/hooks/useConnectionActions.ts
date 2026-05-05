import { useState } from 'react'
import { connectionsApi, type ConnectionStatus } from '../api/connections'

interface UseConnectionActionsResult {
  optimisticStatus: ConnectionStatus | null
  isMutating: boolean
  sendRequest: (targetUserId: string) => Promise<void>
  acceptRequest: (requestId: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
  cancelRequest: (requestId: string) => Promise<void>
}

export function useConnectionActions(
  currentStatus: ConnectionStatus,
  refetch: () => void,
): UseConnectionActionsResult {
  const [optimisticStatus, setOptimisticStatus] = useState<ConnectionStatus | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  async function mutate(
    optimistic: ConnectionStatus,
    action: () => Promise<unknown>,
    rollback: ConnectionStatus,
  ) {
    if (isMutating) return
    setOptimisticStatus(optimistic)
    setIsMutating(true)
    try {
      await action()
      refetch()
    } catch (err) {
      console.error(err)
      setOptimisticStatus(rollback)
    } finally {
      setIsMutating(false)
    }
  }

  return {
    optimisticStatus,
    isMutating,
    sendRequest: (targetUserId) =>
      mutate('pending_outgoing', () => connectionsApi.sendRequest(targetUserId), currentStatus),
    acceptRequest: (requestId) =>
      mutate('connected', () => connectionsApi.acceptRequest(requestId), currentStatus),
    rejectRequest: (requestId) =>
      mutate('none', () => connectionsApi.rejectRequest(requestId), currentStatus),
    cancelRequest: (requestId) =>
      mutate('none', () => connectionsApi.cancelRequest(requestId), currentStatus),
  }
}
