import { apiCall } from './client'
import type { Conversation, Message, SendMessageInput } from '../types/messaging'

export interface ConversationsResponse {
  data: Conversation[]
}

export interface MessagesResponse {
  data: {
    messages: Message[]
    has_more: boolean
  }
}

export interface UnreadCountResponse {
  data: {
    unread_count: number
  }
}

export const messagingApi = {
  getConversations: () =>
    apiCall<ConversationsResponse>('/messages/conversations'),

  getConversation: (id: string) =>
    apiCall<{ data: Conversation }>(`/messages/conversations/${id}`),

  createDirectConversation: (participantId: string) =>
    apiCall<{ data: { conversation_id: string; created: boolean } }>(
      '/messages/conversations',
      { method: 'POST', body: { participant_id: participantId } },
    ),

  getMessages: (conversationId: string, cursor?: string, limit = 50) => {
    const parts: string[] = [`limit=${limit}`]
    if (cursor) parts.push(`cursor=${encodeURIComponent(cursor)}`)
    const qs = parts.join('&')
    return apiCall<MessagesResponse>(
      `/messages/conversations/${conversationId}/messages?${qs}`,
    )
  },

  sendMessage: (input: SendMessageInput) =>
    apiCall<{ data: Message }>('/messages/send', { method: 'POST', body: input }),

  editMessage: (messageId: string, content: string) =>
    apiCall<{ data: Message }>(`/messages/${messageId}`, { method: 'PATCH', body: { content } }),

  deleteMessage: (messageId: string) =>
    apiCall<{ data: { deleted: boolean; conversation_id: string } }>(
      `/messages/${messageId}`,
      { method: 'DELETE' },
    ),

  markRead: (conversationId: string) =>
    apiCall<{ data: { conversation_id: string; read_at: string } }>(
      `/messages/conversations/${conversationId}/read`,
      { method: 'POST' },
    ),

  getUnreadCount: () =>
    apiCall<UnreadCountResponse>('/messages/unread-count'),
}
