import { Elysia, t } from 'elysia'
import * as service from './messaging.service'
import { extractUser } from '../../shared/auth-guard'
import { validationError, notFound, forbidden } from '../../shared/errors'

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB per attachment

export const messagingRoutes = new Elysia({ prefix: '/messages' })

  // POST /messages/conversations — create or get a direct conversation
  .post('/conversations', async ({ body, headers, set }) => {
    const { userId } = extractUser(headers)

    if (body.participant_id === userId) {
      set.status = 400
      return validationError('Cannot create a conversation with yourself')
    }

    const result = await service.getOrCreateDirectConversation(userId, body.participant_id)
    set.status = result.created ? 201 : 200
    return { data: result }
  }, {
    body: t.Object({
      participant_id: t.String({ minLength: 1 }),
    }),
  })

  // GET /messages/conversations — list user's conversations
  .get('/conversations', async ({ headers }) => {
    const { userId } = extractUser(headers)
    const data = await service.listConversations(userId)
    return { data }
  })

  // GET /messages/conversations/:id — get single conversation
  .get('/conversations/:id', async ({ params, headers, set }) => {
    const { userId } = extractUser(headers)
    const data = await service.getConversation(params.id, userId)

    if (!data) {
      set.status = 404
      return notFound('Conversation')
    }

    return { data }
  }, { params: t.Object({ id: t.String() }) })

  // GET /messages/unread-count — total unread count across all conversations
  .get('/unread-count', async ({ headers }) => {
    const { userId } = extractUser(headers)
    const count = await service.getUnreadCount(userId)
    return { data: { unread_count: count } }
  })

  // GET /messages/conversations/:id/messages — paginated messages
  .get('/conversations/:id/messages', async ({ params, query, headers, set }) => {
    const { userId } = extractUser(headers)

    const isAllowed = await service.isParticipant(params.id, userId)
    if (!isAllowed) {
      set.status = 403
      return forbidden('You are not a participant in this conversation')
    }

    const data = await service.getMessages(params.id, userId, {
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : undefined,
    })

    return { data }
  }, {
    params: t.Object({ id: t.String() }),
    query: t.Object({
      cursor: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    }),
  })

  // POST /messages/send — send a message
  .post('/send', async ({ body, headers, set }) => {
    const { userId } = extractUser(headers)

    // Verify sender is participant
    const isAllowed = await service.isParticipant(body.conversation_id, userId)
    if (!isAllowed) {
      set.status = 403
      return forbidden('You are not a participant in this conversation')
    }

    // Validate content exists (text or attachments required)
    if (!body.content && (!body.attachments || body.attachments.length === 0)) {
      set.status = 400
      return validationError('Message must have content or attachments')
    }

    // Validate attachments
    if (body.attachments) {
      for (const att of body.attachments) {
        if (att.size_bytes > MAX_ATTACHMENT_SIZE) {
          set.status = 400
          return validationError(`Attachment "${att.file_name}" exceeds 10MB limit`)
        }
        if (!att.data_uri.startsWith('data:')) {
          set.status = 400
          return validationError(`Attachment "${att.file_name}" must be a valid data URI`)
        }
      }
    }

    const message = await service.sendMessage(userId, {
      conversation_id: body.conversation_id,
      message_type: body.message_type,
      content: body.content,
      reply_to_id: body.reply_to_id,
      metadata: body.metadata,
      attachments: body.attachments,
    })

    set.status = 201
    return { data: message }
  }, {
    body: t.Object({
      conversation_id: t.String({ minLength: 1 }),
      message_type: t.Union([
        t.Literal('text'),
        t.Literal('image'),
        t.Literal('video'),
        t.Literal('file'),
        t.Literal('system'),
      ]),
      content: t.Optional(t.String()),
      reply_to_id: t.Optional(t.String()),
      metadata: t.Optional(t.String()),
      attachments: t.Optional(t.Array(t.Object({
        file_name: t.String({ minLength: 1 }),
        mime_type: t.String({ minLength: 1 }),
        size_bytes: t.Number({ minimum: 1 }),
        data_uri: t.String({ minLength: 1 }),
        preview_uri: t.Optional(t.String()),
      }))),
    }),
  })

  // PATCH /messages/:id — edit a message
  .patch('/:id', async ({ params, body, headers, set }) => {
    const { userId } = extractUser(headers)

    const result = await service.editMessage(params.id, userId, { content: body.content })

    if (!result) {
      set.status = 404
      return notFound('Message')
    }

    return { data: result }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      content: t.String({ minLength: 1 }),
    }),
  })

  // DELETE /messages/:id — soft delete a message
  .delete('/:id', async ({ params, headers, set }) => {
    const { userId } = extractUser(headers)

    const result = await service.deleteMessage(params.id, userId)

    if (!result) {
      set.status = 404
      return notFound('Message')
    }

    return { data: { deleted: true, ...result } }
  }, { params: t.Object({ id: t.String() }) })

  // POST /messages/conversations/:id/read — mark conversation as read
  .post('/conversations/:id/read', async ({ params, headers, set }) => {
    const { userId } = extractUser(headers)

    const isAllowed = await service.isParticipant(params.id, userId)
    if (!isAllowed) {
      set.status = 403
      return forbidden('You are not a participant in this conversation')
    }

    const readAt = await service.markConversationRead(params.id, userId)
    return { data: { conversation_id: params.id, read_at: readAt } }
  }, { params: t.Object({ id: t.String() }) })
