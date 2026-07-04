import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_TOKEN_KEY = 'sportlink_access_token'
const USER_ID_KEY = 'sportlink_user_id'
const ATHLETE_ID_KEY = 'sportlink_athlete_id'

export async function setAccessTokenInStorage(token: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export async function getAccessTokenFromStorage(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY)
}

export async function removeAccessTokenFromStorage(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
}

export async function setUserIdInStorage(userId: string): Promise<void> {
  await AsyncStorage.setItem(USER_ID_KEY, userId)
}

export async function getUserIdFromStorage(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY)
}

export async function setAthleteIdInStorage(athleteId: string): Promise<void> {
  await AsyncStorage.setItem(ATHLETE_ID_KEY, athleteId)
}

export async function getAthleteIdFromStorage(): Promise<string | null> {
  return AsyncStorage.getItem(ATHLETE_ID_KEY)
}

export async function clearAllAuthStorage(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
  await AsyncStorage.removeItem(USER_ID_KEY)
  await AsyncStorage.removeItem(ATHLETE_ID_KEY)
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Decode a base64url string to a binary string. Hermes-safe (no `atob`). */
function base64UrlDecode(input: string): string {
  const str = input.replace(/-/g, '+').replace(/_/g, '/')
  let output = ''
  let buffer = 0
  let bits = 0
  for (let i = 0; i < str.length; i++) {
    const idx = B64_CHARS.indexOf(str[i])
    if (idx === -1) continue
    buffer = (buffer << 6) | idx
    bits += 6
    if (bits >= 8) {
      bits -= 8
      output += String.fromCharCode((buffer >> bits) & 0xff)
    }
  }
  return output
}

/**
 * Returns true only if `token` is a JWT whose `exp` claim is still in the
 * future. A stored access token that's expired (or malformed) must not be
 * trusted on launch — otherwise the app lands on Home with a dead session.
 */
export function isAccessTokenValid(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = base64UrlDecode(parts[1])
    const match = payload.match(/"exp"\s*:\s*(\d+)/)
    if (!match) return false
    const expMs = parseInt(match[1], 10) * 1000
    return Date.now() < expMs
  } catch {
    return false
  }
}
