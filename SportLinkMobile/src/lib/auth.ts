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
