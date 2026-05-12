import { db } from '../../db/connection'
import { generateId } from '../../shared/id'
import type {
  SendMessageInput,
  AttachmentInput,
  EditMessageInput,
  MessagePaginationInput,
  MessageResponse,
  AttachmentResponse,
  ConversationResponse,
  ParticipantResponse,
} from './messaging.types'

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Creates the dm_pair_hash: sorted user_ids joined with ':' */
function dmPairHash(userA: string, userB: string): string {
  return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`
}

// ── Conversations ───────────────────────────────────────────────────────────

/**
 * Get or create a direct conversation between two users.
 * Returns existing conversation if one already exists.
 */
export async function getOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<{ conversation_id: string; created: boolean }> {
  const hash = dmPairHash(currentUserId, otherUserId)

  // Check if DM already exists
  const existing = await db
    .selectFrom('conversations')
    .select('conversation_id')
    .where('dm_pair_hash', '=', hash)
    .executeTakeFirst()

  if (existing) {
    return { conversation_id: existing.conversation_id, created: false }
  }

  // Create new conversation
  const conversationId = generateId()
  const now = new Date().toISOString()

  await db.insertInto('conversations').values({
    conversation_id: conversationId,
    type: 'direct',
    dm_pair_hash: hash,
    created_by: currentUserId,
    created_at: now,
    updated_at: now,
  }).execute()

  // Add both participants
  const participantA = generateId()
  const participantB = generateId()

  await db.insertInto('conversation_participants').values([
    {
      participant_id: participantA,
      conversation_id: conversationId,
      user_id: currentUserId,
      role: 'member',
      is_active: 1,
      joined_at: now,
    },
    {
      participant_id: participantB,
      conversation_id: conversationId,
      user_id: otherUserId,
      role: 'member',
      is_active: 1,
      joined_at: now,
    },
  ]).execute()

  return { conversation_id: conversationId, created: true }
}

/** List conversations for a user, ordered by latest message */
export async function listConversations(userId: string): Promise<ConversationResponse[]> {
  // Get all conversations the user is a participant of
  const participantRows = await db
    .selectFrom('conversation_participants')
    .innerJoin('conversations', 'conversations.conversation_id', 'conversation_participants.conversation_id')
    .select([
      'conversations.conversation_id',
      'conversations.type',
      'conversations.title',
      'conversations.created_at',
      'conversations.updated_at',
      'conversation_participants.last_read_at',
    ])
    .where('conversation_participants.user_id', '=', userId)
    .where('conversation_participants.is_active', '=', 1)
    .execute()

  if (participantRows.length === 0) return []

  const results: ConversationResponse[] = []

  for (const conv of participantRows) {
    // Get participants with profile info (exclude self)
    const participants = (await getConversationParticipants(conv.conversation_id))
      .filter(p => p.user_id !== userId)

    // Get last message
    const lastMessage = await db
      .selectFrom('messages')
      .selectAll()
      .where('conversation_id', '=', conv.conversation_id)
      .where('is_deleted', '=', 0)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst()

    // Count unread messages
    const unreadResult = await db
      .selectFrom('messages')
      .select(db.fn.count<number>('message_id').as('count'))
      .where('conversation_id', '=', conv.conversation_id)
      .where('is_deleted', '=', 0)
      .where('sender_id', '!=', userId)
      .$if(conv.last_read_at != null, qb =>
        qb.where('created_at', '>', conv.last_read_at!)
      )
      .$if(conv.last_read_at == null, qb =>
        qb // all messages are unread if never read
      )
      .executeTakeFirst()

    let lastMessageResponse: MessageResponse | null = null
    if (lastMessage) {
      const attachments = await getMessageAttachments(lastMessage.message_id)
      lastMessageResponse = {
        message_id: lastMessage.message_id,
        conversation_id: lastMessage.conversation_id,
        sender_id: lastMessage.sender_id,
        message_type: lastMessage.message_type as MessageResponse['message_type'],
        content: lastMessage.is_deleted ? null : lastMessage.content,
        reply_to_id: lastMessage.reply_to_id,
        reply_to: null,
        is_edited: lastMessage.is_edited as 0 | 1,
        edited_at: lastMessage.edited_at,
        is_deleted: lastMessage.is_deleted as 0 | 1,
        metadata: lastMessage.metadata,
        attachments,
        created_at: lastMessage.created_at,
      }
    }

    results.push({
      conversation_id: conv.conversation_id,
      type: conv.type as ConversationResponse['type'],
      title: conv.title,
      participants,
      last_message: lastMessageResponse,
      unread_count: Number(unreadResult?.count ?? 0),
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    })
  }

  // Sort by last message time (most recent first), fallback to updated_at
  results.sort((a, b) => {
    const timeA = a.last_message?.created_at ?? a.updated_at
    const timeB = b.last_message?.created_at ?? b.updated_at
    return timeB.localeCompare(timeA)
  })

  return results
}

/** Get a single conversation by ID (with auth check) */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationResponse | null> {
  // Verify user is participant
  const participant = await db
    .selectFrom('conversation_participants')
    .select(['last_read_at'])
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .where('is_active', '=', 1)
    .executeTakeFirst()

  if (!participant) return null

  const conv = await db
    .selectFrom('conversations')
    .selectAll()
    .where('conversation_id', '=', conversationId)
    .executeTakeFirst()

  if (!conv) return null

  const participants = (await getConversationParticipants(conversationId))
    .filter(p => p.user_id !== userId)

  const lastMessage = await db
    .selectFrom('messages')
    .selectAll()
    .where('conversation_id', '=', conversationId)
    .where('is_deleted', '=', 0)
    .orderBy('created_at', 'desc')
    .limit(1)
    .executeTakeFirst()

  const unreadResult = await db
    .selectFrom('messages')
    .select(db.fn.count<number>('message_id').as('count'))
    .where('conversation_id', '=', conversationId)
    .where('is_deleted', '=', 0)
    .where('sender_id', '!=', userId)
    .$if(participant.last_read_at != null, qb =>
      qb.where('created_at', '>', participant.last_read_at!)
    )
    .executeTakeFirst()

  let lastMessageResponse: MessageResponse | null = null
  if (lastMessage) {
    const attachments = await getMessageAttachments(lastMessage.message_id)
    lastMessageResponse = {
      message_id: lastMessage.message_id,
      conversation_id: lastMessage.conversation_id,
      sender_id: lastMessage.sender_id,
      message_type: lastMessage.message_type as MessageResponse['message_type'],
      content: lastMessage.is_deleted ? null : lastMessage.content,
      reply_to_id: lastMessage.reply_to_id,
      reply_to: null,
      is_edited: lastMessage.is_edited as 0 | 1,
      edited_at: lastMessage.edited_at,
      is_deleted: lastMessage.is_deleted as 0 | 1,
      metadata: lastMessage.metadata,
      attachments,
      created_at: lastMessage.created_at,
    }
  }

  return {
    conversation_id: conv.conversation_id,
    type: conv.type as ConversationResponse['type'],
    title: conv.title,
    participants,
    last_message: lastMessageResponse,
    unread_count: Number(unreadResult?.count ?? 0),
    created_at: conv.created_at,
    updated_at: conv.updated_at,
  }
}

/** Get total unread count across all conversations */
export async function getUnreadCount(userId: string): Promise<number> {
  const conversations = await db
    .selectFrom('conversation_participants')
    .select(['conversation_id', 'last_read_at'])
    .where('user_id', '=', userId)
    .where('is_active', '=', 1)
    .execute()

  let total = 0
  for (const conv of conversations) {
    const result = await db
      .selectFrom('messages')
      .select(db.fn.count<number>('message_id').as('count'))
      .where('conversation_id', '=', conv.conversation_id)
      .where('is_deleted', '=', 0)
      .where('sender_id', '!=', userId)
      .$if(conv.last_read_at != null, qb =>
        qb.where('created_at', '>', conv.last_read_at!)
      )
      .executeTakeFirst()

    total += Number(result?.count ?? 0)
  }

  return total
}

// ── Messages ────────────────────────────────────────────────────────────────

/** Send a message */
export async function sendMessage(
  senderId: string,
  input: SendMessageInput
): Promise<MessageResponse> {
  const messageId = generateId()
  const now = new Date().toISOString()

  await db.insertInto('messages').values({
    message_id: messageId,
    conversation_id: input.conversation_id,
    sender_id: senderId,
    message_type: input.message_type,
    content: input.content ?? null,
    reply_to_id: input.reply_to_id ?? null,
    metadata: input.metadata ?? null,
    is_edited: 0,
    is_deleted: 0,
    created_at: now,
  }).execute()

  // Handle attachments
  const attachments: AttachmentResponse[] = []
  if (input.attachments && input.attachments.length > 0) {
    for (const att of input.attachments) {
      const attachmentId = generateId()
      await db.insertInto('message_attachments').values({
        attachment_id: attachmentId,
        message_id: messageId,
        file_name: att.file_name,
        mime_type: att.mime_type,
        size_bytes: att.size_bytes,
        data_uri: att.data_uri,
        preview_uri: att.preview_uri ?? null,
        created_at: now,
      }).execute()

      attachments.push({
        attachment_id: attachmentId,
        file_name: att.file_name,
        mime_type: att.mime_type,
        size_bytes: att.size_bytes,
        data_uri: att.data_uri,
        preview_uri: att.preview_uri ?? null,
      })
    }
  }

  // Update conversation updated_at
  await db.updateTable('conversations')
    .set({ updated_at: now })
    .where('conversation_id', '=', input.conversation_id)
    .execute()

  // Get reply_to message if present
  let replyTo: MessageResponse | null = null
  if (input.reply_to_id) {
    replyTo = await getMessageById(input.reply_to_id)
  }

  return {
    message_id: messageId,
    conversation_id: input.conversation_id,
    sender_id: senderId,
    message_type: input.message_type,
    content: input.content ?? null,
    reply_to_id: input.reply_to_id ?? null,
    reply_to: replyTo,
    is_edited: 0,
    edited_at: null,
    is_deleted: 0,
    metadata: input.metadata ?? null,
    attachments,
    created_at: now,
  }
}

/** Edit a message (only by sender, only text content) */
export async function editMessage(
  messageId: string,
  senderId: string,
  input: EditMessageInput
): Promise<MessageResponse | null> {
  const message = await db
    .selectFrom('messages')
    .selectAll()
    .where('message_id', '=', messageId)
    .executeTakeFirst()

  if (!message) return null
  if (message.sender_id !== senderId) return null
  if (message.is_deleted === 1) return null

  const now = new Date().toISOString()
  await db.updateTable('messages')
    .set({
      content: input.content,
      is_edited: 1,
      edited_at: now,
    })
    .where('message_id', '=', messageId)
    .execute()

  const attachments = await getMessageAttachments(messageId)
  let replyTo: MessageResponse | null = null
  if (message.reply_to_id) {
    replyTo = await getMessageById(message.reply_to_id)
  }

  return {
    message_id: messageId,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    message_type: message.message_type as MessageResponse['message_type'],
    content: input.content,
    reply_to_id: message.reply_to_id,
    reply_to: replyTo,
    is_edited: 1,
    edited_at: now,
    is_deleted: 0,
    metadata: message.metadata,
    attachments,
    created_at: message.created_at,
  }
}

/** Soft delete a message (only by sender) */
export async function deleteMessage(
  messageId: string,
  senderId: string
): Promise<{ conversation_id: string } | null> {
  const message = await db
    .selectFrom('messages')
    .select(['message_id', 'sender_id', 'conversation_id', 'is_deleted'])
    .where('message_id', '=', messageId)
    .executeTakeFirst()

  if (!message) return null
  if (message.sender_id !== senderId) return null
  if (message.is_deleted === 1) return null

  const now = new Date().toISOString()
  await db.updateTable('messages')
    .set({ is_deleted: 1, deleted_at: now })
    .where('message_id', '=', messageId)
    .execute()

  return { conversation_id: message.conversation_id }
}

/** Get paginated messages for a conversation (cursor-based) */
export async function getMessages(
  conversationId: string,
  userId: string,
  pagination: MessagePaginationInput
): Promise<{ messages: MessageResponse[]; has_more: boolean }> {
  // Verify user is participant
  const isParticipant = await db
    .selectFrom('conversation_participants')
    .select('participant_id')
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .where('is_active', '=', 1)
    .executeTakeFirst()

  if (!isParticipant) return { messages: [], has_more: false }

  const limit = Math.min(pagination.limit ?? 50, 100)

  let query = db
    .selectFrom('messages')
    .selectAll()
    .where('conversation_id', '=', conversationId)
    .orderBy('created_at', 'desc')
    .limit(limit + 1) // fetch one extra to determine has_more

  if (pagination.cursor) {
    query = query.where('created_at', '<', pagination.cursor)
  }

  const rows = await query.execute()
  const hasMore = rows.length > limit
  const messageRows = rows.slice(0, limit)

  const messages: MessageResponse[] = []
  for (const row of messageRows) {
    const attachments = row.is_deleted === 1 ? [] : await getMessageAttachments(row.message_id)
    let replyTo: MessageResponse | null = null
    if (row.reply_to_id && row.is_deleted === 0) {
      replyTo = await getMessageById(row.reply_to_id)
    }

    messages.push({
      message_id: row.message_id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      message_type: row.message_type as MessageResponse['message_type'],
      content: row.is_deleted === 1 ? null : row.content,
      reply_to_id: row.reply_to_id,
      reply_to: replyTo,
      is_edited: row.is_edited as 0 | 1,
      edited_at: row.edited_at,
      is_deleted: row.is_deleted as 0 | 1,
      metadata: row.metadata,
      attachments,
      created_at: row.created_at,
    })
  }

  return { messages, has_more: hasMore }
}

// ── Read Receipts ───────────────────────────────────────────────────────────

/** Mark a conversation as read up to now */
export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<string> {
  const now = new Date().toISOString()

  await db.updateTable('conversation_participants')
    .set({ last_read_at: now })
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .execute()

  return now
}

// ── Authorization ───────────────────────────────────────────────────────────

/** Check if user is a participant in a conversation */
export async function isParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const row = await db
    .selectFrom('conversation_participants')
    .select('participant_id')
    .where('conversation_id', '=', conversationId)
    .where('user_id', '=', userId)
    .where('is_active', '=', 1)
    .executeTakeFirst()

  return !!row
}

/** Get participant user_ids for a conversation (for broadcasting) */
export async function getParticipantUserIds(conversationId: string): Promise<string[]> {
  const rows = await db
    .selectFrom('conversation_participants')
    .select('user_id')
    .where('conversation_id', '=', conversationId)
    .where('is_active', '=', 1)
    .execute()

  return rows.map(r => r.user_id)
}

// ── Internal Helpers ────────────────────────────────────────────────────────

async function getConversationParticipants(conversationId: string): Promise<ParticipantResponse[]> {
  const rows = await db
    .selectFrom('conversation_participants')
    .leftJoin('athlete_profiles', 'athlete_profiles.user_id', 'conversation_participants.user_id')
    .select([
      'conversation_participants.user_id',
      'conversation_participants.role',
      'conversation_participants.is_active',
      'athlete_profiles.first_name',
      'athlete_profiles.last_name',
      'athlete_profiles.profile_photo_url',
    ])
    .where('conversation_participants.conversation_id', '=', conversationId)
    .execute()

  return rows.map(r => ({
    user_id: r.user_id,
    first_name: r.first_name ?? '',
    last_name: r.last_name ?? '',
    profile_photo_url: r.profile_photo_url ?? null,
    role: r.role as ParticipantResponse['role'],
    is_active: r.is_active as 0 | 1,
  }))
}

async function getMessageAttachments(messageId: string): Promise<AttachmentResponse[]> {
  const rows = await db
    .selectFrom('message_attachments')
    .select([
      'attachment_id',
      'file_name',
      'mime_type',
      'size_bytes',
      'data_uri',
      'preview_uri',
    ])
    .where('message_id', '=', messageId)
    .execute()

  return rows
}

async function getMessageById(messageId: string): Promise<MessageResponse | null> {
  const row = await db
    .selectFrom('messages')
    .selectAll()
    .where('message_id', '=', messageId)
    .executeTakeFirst()

  if (!row) return null

  const attachments = row.is_deleted === 1 ? [] : await getMessageAttachments(row.message_id)

  return {
    message_id: row.message_id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    message_type: row.message_type as MessageResponse['message_type'],
    content: row.is_deleted === 1 ? null : row.content,
    reply_to_id: row.reply_to_id,
    reply_to: null, // don't recurse deeply
    is_edited: row.is_edited as 0 | 1,
    edited_at: row.edited_at,
    is_deleted: row.is_deleted as 0 | 1,
    metadata: row.metadata,
    attachments,
    created_at: row.created_at,
  }
}
