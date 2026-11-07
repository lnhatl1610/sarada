import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type CatalogFilterOptions = components['schemas']['CatalogFilterOptionsEnvelope']['data']
export type CatalogProductPage = components['schemas']['StorefrontProductPageEnvelope']
export type CatalogProduct = components['schemas']['Product']
export type CatalogReview = components['schemas']['StorefrontReview']
export type CatalogReviewSort = 'latest' | 'rating_desc' | 'rating_asc'
export type CatalogReviewRating = 1 | 2 | 3 | 4 | 5
export type CatalogReviewFilters = { rating: CatalogReviewRating | null; withImages: boolean; size: string | null }

export async function fetchCatalogFilterOptions(signal?: AbortSignal): Promise<CatalogFilterOptions> {
  const response = await api.get<components['schemas']['CatalogFilterOptionsEnvelope']>('/catalog/filter-options', { signal })
  if (!response.data.data) throw new Error('Không tải được tùy chọn lọc sản phẩm.')
  return response.data.data
}

export async function fetchCatalogProductPage(search: string, signal?: AbortSignal): Promise<CatalogProductPage> {
  const params = Object.fromEntries(new URLSearchParams(search))
  const response = await api.get<CatalogProductPage>('/products', { params, signal })
  return response.data
}

export async function fetchCatalogProduct(slug: string, signal?: AbortSignal): Promise<CatalogProduct> {
  const response = await api.get<components['schemas']['ProductEnvelope']>(`/products/${encodeURIComponent(slug)}`, { signal })
  if (!response.data.data) throw new Error('Không tìm thấy sản phẩm.')
  return response.data.data
}

export async function fetchCatalogProducts(search: string, signal?: AbortSignal): Promise<CatalogProduct[]> {
  const response = await fetchCatalogProductPage(search, signal)
  return response.data
}

export async function fetchRelatedCatalogProducts(slug: string, signal?: AbortSignal): Promise<CatalogProduct[]> {
  const response = await api.get<components['schemas']['StorefrontRelatedProductsEnvelope']>(`/products/${encodeURIComponent(slug)}/related`, { signal })
  return response.data.data
}

export async function fetchPersonalizedCatalogProducts(signal?: AbortSignal): Promise<CatalogProduct[]> {
  const response = await api.get<components['schemas']['StorefrontRelatedProductsEnvelope']>('/account/recommendations', { signal })
  return response.data.data
}

export async function subscribeToProductStockAlert(slug: string, variantId: number, contact: { email?: string; phone?: string }): Promise<void> {
  await api.post(`/products/${encodeURIComponent(slug)}/stock-alerts`, { variant_id: variantId, ...contact })
}

export async function fetchCatalogReviews(slug: string, page = 1, sort: CatalogReviewSort = 'latest', filters: CatalogReviewFilters = { rating: null, withImages: false, size: null }, signal?: AbortSignal): Promise<components['schemas']['StorefrontReviewPage']> {
  const response = await api.get<components['schemas']['StorefrontReviewPage']>(`/products/${encodeURIComponent(slug)}/reviews`, {
    params: {
      page,
      sort,
      ...(filters.rating !== null ? { rating: filters.rating } : {}),
      ...(filters.withImages ? { with_images: true } : {}),
      ...(filters.size ? { size: filters.size } : {}),
    },
    signal,
  })
  return response.data
}

export async function fetchRecentStorefrontReviews(signal?: AbortSignal): Promise<components['schemas']['StorefrontReviewPage']> {
  const response = await api.get<components['schemas']['StorefrontReviewPage']>('/reviews', { params: { per_page: 3 }, signal })
  return response.data
}

export async function fetchProductQuestions(slug: string, page = 1, signal?: AbortSignal): Promise<components['schemas']['StorefrontProductQuestionPage']> {
  const response = await api.get<components['schemas']['StorefrontProductQuestionPage']>(`/products/${encodeURIComponent(slug)}/questions`, { params: { page }, signal })
  return response.data
}

export async function submitProductQuestion(slug: string, accessToken: string, question: string): Promise<components['schemas']['StorefrontProductQuestionCreatedEnvelope']['data']> {
  const response = await api.post<components['schemas']['StorefrontProductQuestionCreatedEnvelope' ]>(`/products/${encodeURIComponent(slug)}/questions`, { question }, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.data.data) throw new Error('Chưa gửi được câu hỏi.')
  return response.data.data
}

export async function markReviewHelpful(reviewId: number, visitorId: string): Promise<components['schemas']['ReviewHelpfulVoteEnvelope']['data']> {
  const response = await api.post<components['schemas']['ReviewHelpfulVoteEnvelope']>(`/reviews/${reviewId}/helpful-votes`, { visitor_id: visitorId })
  if (!response.data.data) throw new Error('Chưa ghi nhận được bình chọn.')
  return response.data.data
}
