import { useQuery } from '@tanstack/react-query'
import { connectionsApi, type ConnectionStatus } from '../api/connections'

interface UseConnectionStatusResult {
  status: ConnectionStatus
  requestId: string | null
  isLoading: boolean
  refetch: () => void
}

export function useConnectionStatus(targetUserId: string): UseConnectionStatusResult {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['connection-status', targetUserId],
    queryFn: () => connectionsApi.getStatus(targetUserId),
    enabled: !!targetUserId,
  })

  return {
    status: data?.data.status ?? 'none',
    requestId: data?.data.request_id ?? null,
    isLoading,
    refetch,
  }
}
