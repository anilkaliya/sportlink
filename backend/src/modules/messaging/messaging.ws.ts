import { Elysia } from 'elysia'
import { verifyAccessToken } from '../../shared/jwt'
import * as service from './messaging.service'
import type { WsClientEvent, WsServerEvent } from './messaging.types'

// ── In-memory state (no Redis for MVP) ──────────────────────────────────────

/** Maps userId → Set of WebSocket connections (supports multiple devices) */
const userConnections = new Map<string, Set<any>>()

/** Online user set */
const onlineUsers = new Set<string>()

/** Typing indicators: Map<conversationId, Map<userId, timeout>> */
const typingTimers = new Map<string, Map<string, ReturnType<typeof setTimeout>>>()

// ── Helpers ─────────────────────────────────────────────────────────────────

function addConnection(userId: string, ws: any): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set())
  }
  userConnections.get(userId)!.add(ws)
  onlineUsers.add(userId)
}

function removeConnection(userId: string, ws: any): void {
  const connections = userConnections.get(userId)
  if (connections) {
    connections.delete(ws)
    if (connections.size === 0) {
      userConnections.delete(userId)
      onlineUsers.delete(userId)
    }
  }
}

function sendToUser(userId: string, event: WsServerEvent): void {
  const connections = userConnections.get(userId)
  if (!connections) return
  const payload = JSON.stringify(event)
  for (const ws of connections) {
    ws.send(payload)
  }
}

function broadcastToConversation(
  conversationId: string,
  participantIds: string[],
  event: WsServerEvent,
  excludeUserId?: string
): void {
  for (const uid of participantIds) {
    if (uid === excludeUserId) continue
    sendToUser(uid, event)
  }
}

function clearTyping(conversationId: string, userId: string): void {
  const convTimers = typingTimers.get(conversationId)
  if (!convTimers) return
  const timer = convTimers.get(userId)
  if (timer) {
    clearTimeout(timer)
    convTimers.delete(userId)
  }
  if (convTimers.size === 0) {
    typingTimers.delete(conversationId)
  }
}

// ── Public API for REST routes to broadcast real-time events ────────────────

export function broadcastNewMessage(
  participantIds: string[],
  event: WsServerEvent
): void {
  for (const uid of participantIds) {
    sendToUser(uid, event)
  }
}

export function broadcastMessageUpdate(
  participantIds: string[],
  event: WsServerEvent
): void {
  for (const uid of participantIds) {
    sendToUser(uid, event)
  }
}

export function broadcastMessageDelete(
  participantIds: string[],
  event: WsServerEvent
): void {
  for (const uid of participantIds) {
    sendToUser(uid, event)
  }
}

export function broadcastReadReceipt(
  participantIds: string[],
  event: WsServerEvent
): void {
  for (const uid of participantIds) {
    sendToUser(uid, event)
  }
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId)
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers)
}

// ── WebSocket Elysia plugin ─────────────────────────────────────────────────

export const messagingWs = new Elysia()
  .ws('/ws/messaging', {
    open(ws) {
      // Auth via query param: ?token=<access_token>
      const url = new URL(ws.data.request.url)
      const token = url.searchParams.get('token')

      if (!token) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Missing token' } }))
        ws.close()
        return
      }

      try {
        const { userId } = verifyAccessToken(token)
        // Store userId on the ws data for later use
        ;(ws as any).userId = userId
        addConnection(userId, ws)

        // Notify others this user is online (broadcast to connected users who share conversations)
        // For MVP, we just track it — full presence fanout deferred
        ws.send(JSON.stringify({
          type: 'presence:update',
          payload: { user_id: userId, status: 'online' },
        }))
      } catch {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid token' } }))
        ws.close()
      }
    },

    async message(ws, rawMessage) {
      const userId = (ws as any).userId as string | undefined
      if (!userId) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }))
        return
      }

      let event: WsClientEvent
      try {
        event = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage as WsClientEvent
      } catch {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }))
        return
      }

      switch (event.type) {
        case 'message:send': {
          const input = event.payload
          const isAllowed = await service.isParticipant(input.conversation_id, userId)
          if (!isAllowed) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not a participant' } }))
            return
          }

          if (!input.content && (!input.attachments || input.attachments.length === 0)) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Empty message' } }))
            return
          }

          const message = await service.sendMessage(userId, input)
          const participants = await service.getParticipantUserIds(input.conversation_id)

          // Broadcast to all participants including sender (for multi-device sync)
          broadcastNewMessage(participants, { type: 'message:new', payload: message })

          // Clear typing indicator for this user
          clearTyping(input.conversation_id, userId)
          break
        }

        case 'message:edit': {
          const { message_id, content } = event.payload
          const result = await service.editMessage(message_id, userId, { content })
          if (!result) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Cannot edit message' } }))
            return
          }

          const participants = await service.getParticipantUserIds(result.conversation_id)
          broadcastMessageUpdate(participants, { type: 'message:update', payload: result })
          break
        }

        case 'message:delete': {
          const { message_id } = event.payload
          const result = await service.deleteMessage(message_id, userId)
          if (!result) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Cannot delete message' } }))
            return
          }

          const participants = await service.getParticipantUserIds(result.conversation_id)
          broadcastMessageDelete(participants, {
            type: 'message:delete',
            payload: { message_id, conversation_id: result.conversation_id },
          })
          break
        }

        case 'typing:start': {
          const { conversation_id } = event.payload
          const isAllowed = await service.isParticipant(conversation_id, userId)
          if (!isAllowed) return

          // Set auto-expire timer (5 seconds)
          if (!typingTimers.has(conversation_id)) {
            typingTimers.set(conversation_id, new Map())
          }
          const convTimers = typingTimers.get(conversation_id)!

          // Clear existing timer
          const existing = convTimers.get(userId)
          if (existing) clearTimeout(existing)

          // Auto-stop typing after 5s
          const timer = setTimeout(async () => {
            convTimers.delete(userId)
            const participants = await service.getParticipantUserIds(conversation_id)
            broadcastToConversation(
              conversation_id,
              participants,
              { type: 'typing:stop', payload: { conversation_id, user_id: userId } },
              userId
            )
          }, 5000)
          convTimers.set(userId, timer)

          // Broadcast to others
          const participants = await service.getParticipantUserIds(conversation_id)
          broadcastToConversation(
            conversation_id,
            participants,
            { type: 'typing:start', payload: { conversation_id, user_id: userId } },
            userId
          )
          break
        }

        case 'typing:stop': {
          const { conversation_id } = event.payload
          clearTyping(conversation_id, userId)

          const participants = await service.getParticipantUserIds(conversation_id)
          broadcastToConversation(
            conversation_id,
            participants,
            { type: 'typing:stop', payload: { conversation_id, user_id: userId } },
            userId
          )
          break
        }

        case 'conversation:read': {
          const { conversation_id } = event.payload
          const isAllowed = await service.isParticipant(conversation_id, userId)
          if (!isAllowed) return

          const readAt = await service.markConversationRead(conversation_id, userId)
          const participants = await service.getParticipantUserIds(conversation_id)
          broadcastReadReceipt(participants, {
            type: 'conversation:read',
            payload: { conversation_id, user_id: userId, read_at: readAt },
          })
          break
        }

        default:
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Unknown event type' } }))
      }
    },

    close(ws) {
      const userId = (ws as any).userId as string | undefined
      if (!userId) return

      removeConnection(userId, ws)

      // Clear all typing timers for this user
      for (const [convId, convTimers] of typingTimers) {
        if (convTimers.has(userId)) {
          clearTimeout(convTimers.get(userId)!)
          convTimers.delete(userId)
          if (convTimers.size === 0) typingTimers.delete(convId)
        }
      }

      // If user has no more connections, they're offline
      if (!onlineUsers.has(userId)) {
        // Could broadcast presence:offline to relevant users here
        // Deferred for MVP — would need to iterate shared conversations
      }
    },
  })
