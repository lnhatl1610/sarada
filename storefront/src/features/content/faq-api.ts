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

export async function markFaqHelpful(faqId: number, visitorId: string, helpful: boolean): Promise<components['schemas']['StoreFaqHelpfulVoteEnvelope']['data']> {
  const response = await api.post<components['schemas']['StoreFaqHelpfulVoteEnvelope']>(`/faqs/${faqId}/helpful-votes`, { visitor_id: visitorId, helpful })
  if (!response.data.data) throw new Error('Chưa nhận được phản hồi từ máy chủ. Hãy thử lại.')
  return response.data.data
}
