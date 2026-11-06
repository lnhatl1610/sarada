export type CookiePreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
  savedAt: string
}

export const COOKIE_CONSENT_STORAGE_KEY = 'fashion-store-cookie-consent-v1'
export const COOKIE_CONSENT_UPDATED_EVENT = 'storefront:cookie-consent-updated'
export const STOREFRONT_ANALYTICS_EVENT = 'storefront:analytics-event'

export function readCookiePreferences(): CookiePreferences | null {
  try {
    const raw = readBrowserStorage(COOKIE_CONSENT_STORAGE_KEY)
    const value = JSON.parse(raw ?? 'null') as Partial<CookiePreferences> | null
    if (!value || value.necessary !== true || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean') return null
    return { necessary: true, analytics: value.analytics, marketing: value.marketing, savedAt: typeof value.savedAt === 'string' ? value.savedAt : '' }
  } catch {
    return null
  }
}

export function trackStorefrontEvent(name: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase', parameters: Record<string, unknown>) {
  if (!readCookiePreferences()?.analytics) return
  window.dispatchEvent(new CustomEvent(STOREFRONT_ANALYTICS_EVENT, { detail: { name, parameters } }))
}
import { readBrowserStorage } from '../../lib/browser-storage'

