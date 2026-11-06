import { isAxiosError } from 'axios'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type FaqGroups = components['schemas']['StorefrontFaqGroup'][]

export class StorefrontFaqError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'StorefrontFaqError'
    this.status = status
  }
}

export async function fetchStorefrontFaqs(query: string, signal?: AbortSignal): Promise<FaqGroups> {
  try {
    const response = await api.get<components['schemas']['StorefrontFaqGroupsEnvelope']>('/faqs', { params: query ? { q: query } : undefined, signal })
    return response.data.data ?? []
  } catch (error) {
    if (isAxiosError(error)) throw new StorefrontFaqError(error.message || 'request-failed', error.response?.status)
    throw error
  }
}
