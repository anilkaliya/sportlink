import { verifyAccessToken } from './jwt'
import type { AccessTokenPayload } from './jwt'

/**
 * Use as `beforeHandle` on protected routes.
 * Returns an error response to block, or undefined to continue.
 *
 * Example:
 *   .get('/protected', handler, { beforeHandle: authGuard })
 *
 * To access the verified user inside the handler, call verifyAccessToken
 * on the Authorization header directly, or use Elysia's derive() for
 * automatic context injection.
 */
export function authGuard({ headers, set }: { headers: Record<string, string | undefined>; set: any }):
  | { error: string; message: string }
  | undefined {
  const auth = headers['authorization']
  if (!auth?.startsWith('Bearer ')) {
    set.status = 401
    return { error: 'UNAUTHORIZED', message: 'Missing authorization header' }
  }

  const token = auth.slice(7)
  try {
    verifyAccessToken(token)
  } catch {
    set.status = 401
    return { error: 'UNAUTHORIZED', message: 'Invalid or expired token' }
  }
}

/**
 * Extracts and verifies the access token from the Authorization header.
 * Throws if missing or invalid — use inside handlers after authGuard passes.
 */
export function extractUser(headers: Record<string, string | undefined>): AccessTokenPayload {
  const token = (headers['authorization'] ?? '').slice(7)
  return verifyAccessToken(token)
}
