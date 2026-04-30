import { Elysia, t } from 'elysia'
import * as service from './user.service'
import { conflict, serverError } from '../../shared/errors'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/jwt'
import { saveRefreshToken, isValidRefreshToken, revokeRefreshToken } from '../../shared/token-store'

const REFRESH_COOKIE = 'refreshToken'
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds
const IS_PROD = process.env.NODE_ENV === 'production'

/** Read the refresh token cookie as a string, or undefined. */
function getRefreshToken(cookie: Record<string, { value: unknown } | undefined>): string | undefined {
  const val = cookie[REFRESH_COOKIE]?.value
  return typeof val === 'string' ? val : undefined
}

export const userRoutes = new Elysia({ prefix: '/user' })

  // POST /user/register
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
      password: t.String({ minLength: 8 }),
    }),
  })

  // POST /user/login
  .post('/login', async ({ body, set, cookie }) => {
    try {
      const data = await service.loginUser(body)
      const athlete_id = await service.getAthleteByUserId(data.user_id)

      const accessToken = signAccessToken({ userId: data.user_id, role: data.role })
      const refreshToken = signRefreshToken({ userId: data.user_id })

      await saveRefreshToken(data.user_id, refreshToken)

      cookie[REFRESH_COOKIE]?.set({
        value: refreshToken,
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_MAX_AGE,
      })

      const userData = athlete_id ? { ...data, athlete_id } : data
      return { data: userData, accessToken }
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        set.status = 401
        return { error: 'UNAUTHORIZED' as const, message: 'Invalid email or password' }
      }
      console.error('Login error:', err)
      set.status = 500
      return serverError('Login failed')
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 1 }),
    }),
  })

  // POST /user/refresh
  .post('/refresh', async ({ cookie, set }) => {
    const token = getRefreshToken(cookie)
    if (!token) {
      set.status = 401
      return { error: 'UNAUTHORIZED', message: 'No refresh token' }
    }

    let userId: string
    try {
      const payload = verifyRefreshToken(token)
      userId = payload.userId
    } catch {
      set.status = 401
      return { error: 'UNAUTHORIZED', message: 'Invalid refresh token' }
    }

    const valid = await isValidRefreshToken(userId, token)
    if (!valid) {
      set.status = 401
      return { error: 'UNAUTHORIZED', message: 'Refresh token revoked or expired' }
    }

    const newRefreshToken = signRefreshToken({ userId })
    await saveRefreshToken(userId, newRefreshToken)

    const user = await service.getUserById(userId)
    const accessToken = signAccessToken({ userId, role: user.role })

    cookie[REFRESH_COOKIE]?.set({
      value: newRefreshToken,
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_MAX_AGE,
    })

    return { accessToken }
  })

  // POST /user/logout
  .post('/logout', async ({ cookie }) => {
    const token = getRefreshToken(cookie)
    if (token) {
      try {
        const payload = verifyRefreshToken(token)
        await revokeRefreshToken(payload.userId)
      } catch {
        // Token malformed — still clear the cookie
      }
    }

    cookie[REFRESH_COOKIE]?.remove()

    return { success: true }
  })
