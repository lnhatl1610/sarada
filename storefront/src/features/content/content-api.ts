import { isAxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type StorefrontContentPage = components['schemas']['StorefrontPublicPage']

export class StorefrontContentPageError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'StorefrontContentPageError'
    this.status = status
  }
}

async function fetchStorefrontContentPage(slug: string, signal: AbortSignal): Promise<StorefrontContentPage> {
  try {
    const response = await api.get<components['schemas']['StorefrontPublicPageEnvelope']>(`/pages/${encodeURIComponent(slug)}`, { signal })
    if (!response.data.data) throw new StorefrontContentPageError('not-found', 404)
    return response.data.data
  } catch (error) {
    if (error instanceof StorefrontContentPageError) throw error
    if (isAxiosError(error)) {
      throw new StorefrontContentPageError(error.message || 'request-failed', error.response?.status)
    }
    throw error
  }
}

export function useStorefrontContentPage(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ['pages', 'detail', slug],
    queryFn: ({ signal }) => fetchStorefrontContentPage(slug, signal),
    enabled: enabled && Boolean(slug),
    retry: (failureCount, error) => !(error instanceof StorefrontContentPageError && error.status === 404) && failureCount < 2,
  })
}
