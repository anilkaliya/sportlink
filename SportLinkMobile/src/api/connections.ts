import { apiCall } from './client'
import type { ConnectionRequest } from '../types/athlete'

export type ConnectionStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'connected'

export interface Suggestion {
  athlete_id: string
  name: string
  profile_pic: string | null
  level: string
  location: string
}

export interface SuggestionsResponse {
  suggestions: Suggestion[]
}

export interface ConnectionStatusResponse {
  data: {
    status: ConnectionStatus
    request_id?: string
  }
}

export interface ConnectionRequestsResponse {
  data: {
    incoming: ConnectionRequest[]
    outgoing: ConnectionRequest[]
  }
}

export const connectionsApi = {
  getStatus: (targetUserId: string) =>
    apiCall<ConnectionStatusResponse>(`/connections/status?user_id=${targetUserId}`),

  listRequests: () =>
    apiCall<ConnectionRequestsResponse>('/connections/requests'),

  sendRequest: (receiverId: string) =>
    apiCall<unknown>('/connections/request', {
      method: 'POST',
      body: { receiver_id: receiverId },
    }),

  acceptRequest: (requestId: string) =>
    apiCall<unknown>(`/connections/${requestId}/accept`, {
      method: 'PATCH',
    }),

  rejectRequest: (requestId: string) =>
    apiCall<unknown>(`/connections/${requestId}/reject`, {
      method: 'PATCH',
    }),

  cancelRequest: (requestId: string) =>
    apiCall<unknown>(`/connections/${requestId}`, {
      method: 'DELETE',
    }),

  getSuggestions: (athleteId: string) =>
    apiCall<SuggestionsResponse>(`/connections/${athleteId}/suggestions`),
}
