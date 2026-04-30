import jwt from 'jsonwebtoken'

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'sportlink-access-secret-change-in-prod'
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'sportlink-refresh-secret-change-in-prod'

export interface AccessTokenPayload {
  userId: string
  role: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string }
}
