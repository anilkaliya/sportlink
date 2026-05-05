import { useQuery } from '@tanstack/react-query'
import { connectionsApi } from '../api/connections'
import type { ConnectionRequest } from '../types/athlete'

interface UseIncomingRequestsResult {
  requests: ConnectionRequest[]
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useIncomingRequests(): UseIncomingRequestsResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => connectionsApi.listRequests(),
    refetchInterval: 60_000,
  })

  return {
    requests: data?.data?.incoming ?? [],
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
  }
}
