import { getAccessTokenFromLocalStorage } from '../lib/auth'
import { useAuthStore } from '../stores/authStore'

const BASE_URL = import.meta.env['VITE_API_URL'] ?? '/api'

// Messages sent by the server-side auth guard (not login failures)
const AUTH_GUARD_MESSAGES = new Set([
  'Missing authorization header',
  'Invalid or expired token',
])

type ApiError = {
  message?: string
  data?: unknown
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function apiCall<T>(
  path: string,
  options?: {
    method?: HttpMethod
    body?: unknown
    headers?: HeadersInit
  }
): Promise<T> {
  const method = options?.method ?? 'GET'
  const hasBody = options?.body !== undefined

  const normalizedBody =
    hasBody &&
    typeof options!.body === 'object' &&
    options!.body !== null &&
    'payload' in (options!.body as Record<string, unknown>)
      ? (options!.body as any).payload
      : options?.body

  const accessToken = getAccessTokenFromLocalStorage()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers || {}),
    },
    body: hasBody ? JSON.stringify(normalizedBody) : undefined,
  })

  let data: unknown = null

  try {
    data = await res.json()
  } catch(error) {
    console.log(error)
  }

  if (!res.ok) {
    const err = data as ApiError
    const message = err?.message ?? `Request failed (${res.status})`

    if (res.status === 401 && AUTH_GUARD_MESSAGES.has(message)) {
      useAuthStore.getState().clearAuth()
      window.location.replace('/signin')
    }

    throw new Error(message)
  }

  return data as T
}