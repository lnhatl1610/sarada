import { api } from '../../lib/http'
import type { components } from '../../types/api'

type RecentlyViewedProductsEnvelope = components['schemas']['RecentlyViewedProductsEnvelope']

export async function fetchAccountRecentlyViewedProductSlugs(signal?: AbortSignal): Promise<string[]> {
  const response = await api.get<RecentlyViewedProductsEnvelope>('/account/recently-viewed-products', { signal })
  return response.data.data.slugs
}

export async function syncAccountRecentlyViewedProductSlugs(slugs: string[]): Promise<string[]> {
  const response = await api.put<RecentlyViewedProductsEnvelope>('/account/recently-viewed-products', { slugs })
  return response.data.data.slugs
}
