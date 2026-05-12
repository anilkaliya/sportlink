// ── Input types ─────────────────────────────────────────────────────────────

export interface CreateConversationInput {
  participant_id: string // the other user for DM
}

export interface SendMessageInput {
  conversation_id: string
  message_type: 'text' | 'image' | 'video' | 'file' | 'system'
  content?: string
  reply_to_id?: string
  metadata?: string // JSON string
  attachments?: AttachmentInput[]
}

export interface AttachmentInput {
  file_name: string
  mime_type: string
  size_bytes: number
  data_uri: string // data:<mime>;base64,<content>
  preview_uri?: string
}

export interface EditMessageInput {
  content: string
}

export interface MarkReadInput {
  conversation_id: string
}

export interface MessagePaginationInput {
  cursor?: string // ISO timestamp — fetch messages before this
  limit?: number  // default 50, max 100
}

// ── Response types ──────────────────────────────────────────────────────────

export interface ConversationResponse {
  conversation_id: string
  type: 'direct' | 'group' | 'broadcast'
  title: string | null
  participants: ParticipantResponse[]
  last_message: MessageResponse | null
  unread_count: number
  created_at: string
  updated_at: string
}

export interface ParticipantResponse {
  user_id: string
  first_name: string
  last_name: string
  profile_photo_url: string | null
  role: 'member' | 'admin' | 'owner'
  is_active: 0 | 1
}

export interface MessageResponse {
  message_id: string
  conversation_id: string
  sender_id: string
  message_type: 'text' | 'image' | 'video' | 'file' | 'system'
  content: string | null
  reply_to_id: string | null
  reply_to: MessageResponse | null
  is_edited: 0 | 1
  edited_at: string | null
  is_deleted: 0 | 1
  metadata: string | null
  attachments: AttachmentResponse[]
  created_at: string
}

export interface AttachmentResponse {
  attachment_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  data_uri: string
  preview_uri: string | null
}

// ── WebSocket event types ───────────────────────────────────────────────────

export type WsClientEvent =
  | { type: 'message:send'; payload: SendMessageInput }
  | { type: 'message:edit'; payload: { message_id: string; content: string } }
  | { type: 'message:delete'; payload: { message_id: string } }
  | { type: 'typing:start'; payload: { conversation_id: string } }
  | { type: 'typing:stop'; payload: { conversation_id: string } }
  | { type: 'conversation:read'; payload: { conversation_id: string } }

export type WsServerEvent =
  | { type: 'message:new'; payload: MessageResponse }
  | { type: 'message:update'; payload: MessageResponse }
  | { type: 'message:delete'; payload: { message_id: string; conversation_id: string } }
  | { type: 'typing:start'; payload: { conversation_id: string; user_id: string } }
  | { type: 'typing:stop'; payload: { conversation_id: string; user_id: string } }
  | { type: 'conversation:read'; payload: { conversation_id: string; user_id: string; read_at: string } }
  | { type: 'presence:update'; payload: { user_id: string; status: 'online' | 'offline' } }
  | { type: 'error'; payload: { message: string } }
