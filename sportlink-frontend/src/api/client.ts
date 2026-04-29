const BASE_URL = import.meta.env['VITE_API_URL'] ?? '/api'

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

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
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
    throw new Error(err?.message || `Request failed (${res.status})`)
  }

  return data as T
}