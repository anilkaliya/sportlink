import { Elysia, t } from 'elysia'
import * as service from './user.service'
import { conflict, serverError } from '../../shared/errors'

export const userRoutes = new Elysia({ prefix: '/user' })

  // POST /user — register
  .post('/register', async ({ body, set }) => {
    try {
      const { email } = body
      console.log('Registering user with email:', email)
      const data = await service.registerUser(body)
      set.status = 201
      return { data }
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_CONFLICT') {
        set.status = 409
        return conflict('Email already registered')
      }
      console.error('Registration error:', err)
      set.status = 500
      return serverError('Registration failed')
    }
  }, {
    body: t.Object({
      email: t.String(),
      mobile_number: t.String(),
      password: t.String({ minLength: 8 })
    }),
  })

  // POST /user/login — authenticate
  .post('/login', async ({ body, set }) => {
    try {
      const data = await service.loginUser(body)
      const athlete_id = await service.getAthleteByUserId(data.user_id)
      return { data: { ...data, athlete_id } }
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        set.status = 401
        return { error: 'UNAUTHORIZED' as const, message: 'Invalid email or password' }
      }
      set.status = 500
      return serverError('Login failed')
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 1 }),
    }),
  })
