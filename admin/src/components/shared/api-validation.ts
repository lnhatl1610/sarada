import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

export type ApiFieldErrors = Record<string, string[]>

export class ApiResponseError extends Error {
  readonly status: number
  readonly fieldErrors?: ApiFieldErrors

  constructor(message: string, status: number, fieldErrors?: ApiFieldErrors) {
    super(message)
    this.name = 'ApiResponseError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function createApiResponseError(
  body: { message?: string; errors?: ApiFieldErrors },
  status: number,
  fallback: string,
): ApiResponseError {
  const firstFieldError = Object.values(body.errors ?? {}).flat().find(Boolean)
  return new ApiResponseError(firstFieldError ?? body.message ?? fallback, status, body.errors)
}

export function applyServerValidationErrors<T extends FieldValues>(
  form: Pick<UseFormReturn<T, unknown, unknown>, 'setError'>,
  error: unknown,
  fieldMap: Partial<Record<string, FieldPath<T>>> = {},
): boolean {
  if (!(error instanceof ApiResponseError) || error.status !== 422 || !error.fieldErrors) return false

  for (const [serverField, messages] of Object.entries(error.fieldErrors)) {
    const message = messages.find(Boolean)
    if (!message) continue
    const field = fieldMap[serverField] ?? serverField as FieldPath<T>
    form.setError(field, { type: 'server', message })
  }

  return true
}
