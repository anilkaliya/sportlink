import { createHash } from 'crypto'
import { db } from '../db/connection'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Revoke any existing token for this user before saving the new one
  await db.deleteFrom('refresh_tokens').where('user_id', '=', userId).execute()

  await db
    .insertInto('refresh_tokens')
    .values({
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    })
    .execute()
}

export async function isValidRefreshToken(userId: string, token: string): Promise<boolean> {
  const tokenHash = hashToken(token)
  const row = await db
    .selectFrom('refresh_tokens')
    .select(['token_hash', 'expires_at'])
    .where('user_id', '=', userId)
    .where('token_hash', '=', tokenHash)
    .executeTakeFirst()

  if (!row) return false
  if (new Date(row.expires_at) < new Date()) {
    // Expired — clean it up
    await db.deleteFrom('refresh_tokens').where('user_id', '=', userId).execute()
    return false
  }

  return true
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await db.deleteFrom('refresh_tokens').where('user_id', '=', userId).execute()
}
