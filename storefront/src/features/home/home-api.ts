import { isAxiosError } from 'axios'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type StorefrontBanner = components['schemas']['StorefrontBanner']
export type StorefrontCollection = components['schemas']['StorefrontCollection']
export type StorefrontPageLink = Pick<components['schemas']['StorefrontPublicPage'], 'id' | 'title' | 'slug' | 'is_published'>
export type StorefrontCategory = components['schemas']['StorefrontCategory']
export type StorefrontHomeSectionKey = 'hero' | 'categories' | 'new_arrivals' | 'campaign' | 'best_sellers' | 'recently_viewed' | 'personalized' | 'collections' | 'service_strip' | 'lookbook' | 'newsletter' | 'membership' | 'instagram'
export type StorefrontHomeSection = { key: StorefrontHomeSectionKey; enabled: boolean }
export const DEFAULT_STOREFRONT_HOME_SECTIONS: StorefrontHomeSection[] = [
  { key: 'hero', enabled: true }, { key: 'categories', enabled: true }, { key: 'new_arrivals', enabled: true },
  { key: 'campaign', enabled: true }, { key: 'best_sellers', enabled: true }, { key: 'recently_viewed', enabled: true }, { key: 'personalized', enabled: true }, { key: 'collections', enabled: true },
  { key: 'service_strip', enabled: true }, { key: 'lookbook', enabled: true }, { key: 'newsletter', enabled: true }, { key: 'membership', enabled: true },
  { key: 'instagram', enabled: true },
]

export type StorefrontInstagramPost = { post_url: string; image_url: string; alt: string }

export class StorefrontCollectionError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'StorefrontCollectionError'
    this.status = status
  }
}

export async function fetchStorefrontCategories(signal?: AbortSignal): Promise<StorefrontCategory[]> {
  const response = await api.get<components['schemas']['StorefrontCategoryTree']>('/categories', { signal })
  return response.data.data ?? []
}

export async function fetchStorefrontBanners(signal?: AbortSignal): Promise<StorefrontBanner[]> {
  const response = await api.get<components['schemas']['StorefrontBannerList']>('/banners', { signal })
  return response.data.data ?? []
}

export async function fetchStorefrontCollections(signal?: AbortSignal): Promise<StorefrontCollection[]> {
  const response = await api.get<components['schemas']['StorefrontCollectionPage']>('/collections', { signal })
  return response.data.data ?? []
}

export async function fetchStorefrontCollection(slug: string, signal?: AbortSignal): Promise<StorefrontCollection> {
  try {
    const response = await api.get<{ data?: StorefrontCollection }>(`/collections/${encodeURIComponent(slug)}`, { params: { include_products: 0 }, signal })
    if (!response.data.data) throw new StorefrontCollectionError('not-found', 404)
    if (!response.data.data.is_lookbook) return response.data.data
    const [products, lookbook] = await Promise.all([
      api.get<{ data?: StorefrontCollection }>(`/collections/${encodeURIComponent(slug)}`, { params: { include_products: 1 }, signal }),
      api.get<{ data?: StorefrontCollection }>(`/collections/${encodeURIComponent(slug)}`, { params: { include_products: 1, include_lookbook_products: 1 }, signal }),
    ])
    if (!products.data.data || !lookbook.data.data) throw new StorefrontCollectionError('not-found', 404)
    return { ...response.data.data, products: products.data.data.products ?? [], lookbook_products: lookbook.data.data.lookbook_products ?? [] }
  } catch (error) {
    if (error instanceof StorefrontCollectionError) throw error
    if (isAxiosError(error)) throw new StorefrontCollectionError(error.message || 'request-failed', error.response?.status)
    throw error
  }
}

export async function fetchStorefrontPageLinks(signal?: AbortSignal): Promise<StorefrontPageLink[]> {
  const response = await api.get<components['schemas']['StorefrontPublicPageLinkList']>('/pages', { signal })
  return response.data.data ?? []
}

export async function subscribeToNewsletter(email: string, consent: boolean): Promise<string> {
  const response = await api.post<components['schemas']['NewsletterSubscriptionAccepted']>('/newsletter/subscriptions', { email, consent })
  return response.data.data.message
}
