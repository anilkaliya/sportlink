import { create } from 'zustand'
import type { Conversation, Message } from '../types/messaging'

interface TypingState {
  [conversationId: string]: string[] // user_ids currently typing
}

interface PresenceState {
  [userId: string]: 'online' | 'offline'
}

interface MessagingState {
  conversations: Conversation[]
  messages: Record<string, Message[]> // keyed by conversation_id
  typing: TypingState
  presence: PresenceState
  totalUnread: number
  activeConversationId: string | null

  // Actions
  setConversations: (convos: Conversation[]) => void
  updateConversation: (convo: Partial<Conversation> & { conversation_id: string }) => void
  moveConversationToTop: (conversationId: string, lastMessage: Message) => void

  setMessages: (conversationId: string, messages: Message[]) => void
  prependMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  deleteMessage: (messageId: string, conversationId: string) => void
  setMessageStatus: (tempId: string, conversationId: string, status: 'sent' | 'failed', realMessage?: Message) => void

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void
  setPresence: (userId: string, status: 'online' | 'offline') => void
  setTotalUnread: (count: number) => void
  decrementUnread: (conversationId: string) => void
  setActiveConversation: (id: string | null) => void
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  messages: {},
  typing: {},
  presence: {},
  totalUnread: 0,
  activeConversationId: null,

  setConversations: (conversations) => set({ conversations }),

  updateConversation: (partial) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.conversation_id === partial.conversation_id ? { ...c, ...partial } : c,
      ),
    })),

  moveConversationToTop: (conversationId, lastMessage) =>
    set((s) => {
      const convos = [...s.conversations]
      const idx = convos.findIndex((c) => c.conversation_id === conversationId)
      if (idx === -1) return s
      const convo = { ...convos[idx], last_message: lastMessage, updated_at: lastMessage.created_at }
      // If message is from another user and not active conversation, increment unread
      const isActive = s.activeConversationId === conversationId
      if (!isActive && lastMessage.sender_id !== getCurrentUserId()) {
        convo.unread_count = (convo.unread_count || 0) + 1
      }
      convos.splice(idx, 1)
      convos.unshift(convo)
      const totalUnread = convos.reduce((sum, c) => sum + c.unread_count, 0)
      return { conversations: convos, totalUnread }
    }),

  setMessages: (conversationId, messages) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: messages } })),

  prependMessages: (conversationId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...messages, ...(s.messages[conversationId] ?? [])],
      },
    })),

  addMessage: (message) =>
    set((s) => {
      const convId = message.conversation_id
      const existing = s.messages[convId] ?? []
      // Dedupe
      if (existing.some((m) => m.message_id === message.message_id)) return s
      // Replace optimistic message if matching _tempId
      const filtered = existing.filter((m) => m._tempId !== message._tempId)
      return { messages: { ...s.messages, [convId]: [...filtered, message] } }
    }),

  updateMessage: (message) =>
    set((s) => {
      const convId = message.conversation_id
      const msgs = s.messages[convId] ?? []
      return {
        messages: {
          ...s.messages,
          [convId]: msgs.map((m) => (m.message_id === message.message_id ? message : m)),
        },
      }
    }),

  deleteMessage: (messageId, conversationId) =>
    set((s) => {
      const msgs = s.messages[conversationId] ?? []
      return {
        messages: {
          ...s.messages,
          [conversationId]: msgs.map((m) =>
            m.message_id === messageId ? { ...m, is_deleted: 1 as const, content: null } : m,
          ),
        },
      }
    }),

  setMessageStatus: (tempId, conversationId, status, realMessage) =>
    set((s) => {
      const msgs = s.messages[conversationId] ?? []
      return {
        messages: {
          ...s.messages,
          [conversationId]: msgs.map((m) => {
            if (m._tempId === tempId) {
              if (realMessage) return { ...realMessage, _status: 'sent' as const }
              return { ...m, _status: status }
            }
            return m
          }),
        },
      }
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = s.typing[conversationId] ?? []
      const updated = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId)
      return { typing: { ...s.typing, [conversationId]: updated } }
    }),

  setPresence: (userId, status) =>
    set((s) => ({ presence: { ...s.presence, [userId]: status } })),

  setTotalUnread: (count) => set({ totalUnread: count }),

  decrementUnread: (conversationId) =>
    set((s) => {
      const convos = s.conversations.map((c) =>
        c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c,
      )
      const totalUnread = convos.reduce((sum, c) => sum + c.unread_count, 0)
      return { conversations: convos, totalUnread }
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),
}))

// Helper to get current user ID without circular import
function getCurrentUserId(): string {
  // Lazy import to avoid circular dependency
  const { useAuthStore } = require('../stores/authStore')
  return useAuthStore.getState().userId ?? ''
}
