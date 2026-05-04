import { Elysia, t } from 'elysia'
import * as service from './connections.service'
import { extractUser } from '../../shared/auth-guard'
import { validationError, notFound, conflict, forbidden } from '../../shared/errors'

export const connectionRoutes = new Elysia({ prefix: '/connections' })

  // POST /connections/request — send a connection request
  .post('/request', async ({ body, headers, set }) => {
    const { userId } = extractUser(headers)
    const result = await service.sendRequest(userId, body.receiver_id)

    if ('error' in result) {
      switch (result.error) {
        case 'SELF_REQUEST':
          set.status = 400
          return validationError('Cannot send a connection request to yourself')
        case 'ALREADY_CONNECTED':
          set.status = 409
          return conflict('You are already connected with this user')
        case 'DUPLICATE_REQUEST':
          set.status = 409
          return conflict('A pending request to this user already exists')
      }
    }

    set.status = 201
    return { data: result }
  }, {
    body: t.Object({
      receiver_id: t.String({ minLength: 1 }),
    }),
  })

  // PATCH /connections/:id/accept — receiver accepts
  .patch('/:id/accept', async ({ params, headers, set }) => {
    const { userId } = extractUser(headers)
    const result = await service.acceptRequest(params.id, userId)

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          set.status = 404
          return notFound('Connection request')
        case 'FORBIDDEN':
          set.status = 403
          return forbidden('Only the receiver can accept this request')
        case 'NOT_PENDING':
          set.status = 409
          return conflict('Request is no longer pending')
      }
    }

    return { data: result }
  }, { params: t.Object({ id: t.String() }) })

  // PATCH /connections/:id/reject — receiver rejects
  .patch('/:id/reject', async ({ params, headers, set }) => {
    const { userId } = extractUser(headers)
    const result = await service.rejectRequest(params.id, userId)

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          set.status = 404
          return notFound('Connection request')
        case 'FORBIDDEN':
          set.status = 403
          return forbidden('Only the receiver can reject this request')
        case 'NOT_PENDING':
          set.status = 409
          return conflict('Request is no longer pending')
      }
    }

    return { data: result }
  }, { params: t.Object({ id: t.String() }) })

  // DELETE /connections/:id — sender cancels
  .delete('/:id', async ({ params, headers, set }) => {
    const { userId } = extractUser(headers)
    const result = await service.cancelRequest(params.id, userId)

    if ('error' in result) {
      switch (result.error) {
        case 'NOT_FOUND':
          set.status = 404
          return notFound('Connection request')
        case 'FORBIDDEN':
          set.status = 403
          return forbidden('Only the sender can cancel this request')
        case 'NOT_PENDING':
          set.status = 409
          return conflict('Request is no longer pending')
      }
    }

    set.status = 200
    return { data: result }
  }, { params: t.Object({ id: t.String() }) })

  // GET /connections — my accepted connections
  .get('', async ({ headers }) => {
    const { userId } = extractUser(headers)
    const data = await service.getConnections(userId)
    return { data }
  })

  // GET /connections/requests — my pending requests (incoming + outgoing)
  .get('/requests', async ({ headers }) => {
    const { userId } = extractUser(headers)
    const data = await service.getPendingRequests(userId)
    return { data }
  })

  .get('/status', async ({ headers }) => {
    const { userId } = extractUser(headers)
    const data = await service.getPendingRequests(userId)
    return { data }
  })

  // GET /connections/:id/suggestions — suggested athletes to connect with
  .get('/:id/suggestions', async ({ params, set }) => {
    const result = await service.getSuggestions(params.id)
    if ('error' in result) {
      set.status = 404
      return notFound('Athlete')
    }
    return { suggestions: result }
  }, { params: t.Object({ id: t.String() }) })
