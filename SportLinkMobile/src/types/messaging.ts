export type MessageType = 'text' | 'image' | 'video' | 'file' | 'system'
export type ConversationType = 'direct' | 'group' | 'broadcast'
export type ParticipantRole = 'member' | 'admin' | 'owner'

export interface Participant {
  user_id: string
  first_name: string
  last_name: string
  profile_photo_url: string | null
  role: ParticipantRole
  is_active: 0 | 1
}

export interface Attachment {
  attachment_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  data_uri: string
  preview_uri: string | null
}

export interface AttachmentInput {
  file_name: string
  mime_type: string
  size_bytes: number
  data_uri: string
  preview_uri?: string
}

export interface Message {
  message_id: string
  conversation_id: string
  sender_id: string
  message_type: MessageType
  content: string | null
  reply_to_id: string | null
  reply_to: Message | null
  is_edited: 0 | 1
  edited_at: string | null
  is_deleted: 0 | 1
  metadata: string | null
  attachments: Attachment[]
  created_at: string
  // Client-only fields
  _status?: 'sending' | 'sent' | 'failed'
  _tempId?: string
}

export interface Conversation {
  conversation_id: string
  type: ConversationType
  title: string | null
  participants: Participant[]
  last_message: Message | null
  unread_count: number
  created_at: string
  updated_at: string
}

export interface SendMessageInput {
  conversation_id: string
  message_type: MessageType
  content?: string
  reply_to_id?: string
  metadata?: string
  attachments?: AttachmentInput[]
}

// WebSocket event types
export type WsClientEvent =
  | { type: 'message:send'; payload: SendMessageInput }
  | { type: 'message:edit'; payload: { message_id: string; content: string } }
  | { type: 'message:delete'; payload: { message_id: string } }
  | { type: 'typing:start'; payload: { conversation_id: string } }
  | { type: 'typing:stop'; payload: { conversation_id: string } }
  | { type: 'conversation:read'; payload: { conversation_id: string } }

export type WsServerEvent =
  | { type: 'message:new'; payload: Message }
  | { type: 'message:update'; payload: Message }
  | { type: 'message:delete'; payload: { message_id: string; conversation_id: string } }
  | { type: 'typing:start'; payload: { conversation_id: string; user_id: string } }
  | { type: 'typing:stop'; payload: { conversation_id: string; user_id: string } }
  | { type: 'presence:update'; payload: { user_id: string; status: 'online' | 'offline' } }
  | { type: 'conversation:read'; payload: { conversation_id: string; user_id: string; read_at: string } }
  | { type: 'error'; payload: { message: string } }
