export const notFound = (entity: string) => ({
  error: 'NOT_FOUND' as const,
  message: `${entity} not found`,
})

export const validationError = (detail: string) => ({
  error: 'VALIDATION_ERROR' as const,
  message: detail,
})

export const conflict = (detail: string) => ({
  error: 'CONFLICT' as const,
  message: detail,
})

export const serverError = (detail: string) => ({
  error: 'SERVER_ERROR' as const,
  message: detail,
})
