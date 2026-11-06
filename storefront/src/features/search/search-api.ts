import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type SearchProduct = components['schemas']['Product']
export type SearchContentSuggestion = components['schemas']['SearchContentSuggestion']
export type TrendingSearchTerm = components['schemas']['TrendingSearchTerm']
export type StorefrontSearchPageResults = components['schemas']['StorefrontSearchPageResultsEnvelope']

export async function fetchSearchSuggestions(query: string, signal?: AbortSignal): Promise<SearchProduct[]> {
  const response = await api.get<components['schemas']['StorefrontProductPageEnvelope']>('/products', {
    params: { q: query, per_page: 4, sort: 'relevance' },
    signal,
  })

  return response.data.data ?? []
}

export async function fetchSearchContentSuggestions(query: string, signal?: AbortSignal): Promise<SearchContentSuggestion[]> {
  const response = await api.get<components['schemas']['SearchContentSuggestionEnvelope']>('/search/content-suggestions', {
    params: { q: query },
    signal,
  })

  return response.data.data ?? []
}

export async function fetchSearchPages(query: string, page: number, signal?: AbortSignal): Promise<StorefrontSearchPageResults> {
  const response = await api.get<StorefrontSearchPageResults>('/search/pages', {
    params: { q: query, page, per_page: 12 },
    signal,
  })

  return response.data
}

export async function fetchTrendingSearchTerms(signal?: AbortSignal): Promise<TrendingSearchTerm[]> {
  const response = await api.get<components['schemas']['TrendingSearchTermsEnvelope']>('/search/trending', { signal })
  return response.data.data ?? []
}

export async function trackSearchTerm(query: string): Promise<void> {
  await api.post<components['schemas']['SearchTermTrackEnvelope']>('/search/terms', { q: query })
}
