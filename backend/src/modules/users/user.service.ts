import { db } from '../../db/connection'
import { generateId } from '../../shared/id'
import type { User } from '../../db/schema'
import type { RegisterInput, LoginInput, UserResponse } from './user.types'

function toUserResponse(user: User): UserResponse {
  const { password_hash: _, ...rest } = user
  return {
    ...rest,
    onboarding_step: user.onboarding_step ?? 0,
    onboarding_complete: (user.onboarding_step ?? 0) === 3,
  }
}

export async function registerUser(data: RegisterInput): Promise<UserResponse> {
  console.log('Registering user with email:', data.email)

  const existing = await db
    .selectFrom('users')
    .select('user_id')
    .where('email', '=', data.email)
    .executeTakeFirst()

  if (existing) throw new Error('EMAIL_CONFLICT')

  const password_hash = await Bun.password.hash(data.password)

  const user = await db
    .insertInto('users')
    .values({
      user_id: generateId(),
      email: data.email,
      phone: data.mobile_number,
      password_hash,
      role: data.role ?? 'athlete',
      onboarding_step: 0,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return toUserResponse(user)
}

export async function loginUser(data: LoginInput): Promise<UserResponse> {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', data.email)
    .executeTakeFirst()

  if (!user) throw new Error('INVALID_CREDENTIALS')

  const valid = await Bun.password.verify(data.password, user.password_hash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  return toUserResponse(user)
}

export async function incrementOnboardingStep(user_id: string): Promise<number> {
  await db
    .updateTable('users')
    .set(eb => ({ onboarding_step: eb('onboarding_step', '+', 1) }))
    .where('user_id', '=', user_id)
    .execute()

  const user = await db
    .selectFrom('users')
    .select('onboarding_step')
    .where('user_id', '=', user_id)
    .executeTakeFirstOrThrow()

  return user.onboarding_step ?? 0
}

export async function setOnboardingComplete(user_id: string): Promise<void> {
  await db
    .updateTable('users')
    .set({ onboarding_step: 3 })
    .where('user_id', '=', user_id)
    .execute()
}

export async function getUserById(userId: string): Promise<UserResponse> {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirstOrThrow()

  return toUserResponse(user)
}

export async function getAthleteByUserId(id: string) {
  const profile = await db
    .selectFrom('athlete_profiles')
    .select('athlete_id')
    .where('user_id', '=', id)
    .executeTakeFirst()

  if (!profile) {
    return null
  }
  return profile.athlete_id
}