import { useEffect, useState } from 'react'
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readCookiePreferences,
  STOREFRONT_ANALYTICS_EVENT,
} from './cookie-consent'

type AnalyticsEventName = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase'
type AnalyticsEventDetail = { name: AnalyticsEventName; parameters: Record<string, unknown> }

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...arguments_: unknown[]) => void
  }
}

const validMeasurementId = (value: string) => /^G-[A-Z0-9]{6,20}$/i.test(value)

function initializeGoogleAnalytics(measurementId: string) {
  window.dataLayer ??= []
  window.gtag ??= (...args: unknown[]) => { window.dataLayer?.push(args) }
  const gtag = window.gtag
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })

  const configuredIds = (window as Window & { __storefrontGaIds?: Set<string> }).__storefrontGaIds ?? new Set<string>()
  ;(window as Window & { __storefrontGaIds?: Set<string> }).__storefrontGaIds = configuredIds
  if (!configuredIds.has(measurementId)) {
    gtag('js', new Date())
    gtag('config', measurementId, { send_page_view: false })
    configuredIds.add(measurementId)
  }

  if (!document.getElementById('storefront-google-analytics')) {
    const script = document.createElement('script')
    script.id = 'storefront-google-analytics'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.append(script)
  }
}

function normalizedPagePath(path: string) {
  return path
    .replace(/^\/reset-password\/[^/]+/, '/reset-password/:token')
    .replace(/^\/checkout\/success\/[^/]+/, '/checkout/success/:order')
    .replace(/^\/order-success\/[^/]+/, '/order-success/:order')
    .replace(/^\/account\/orders\/[^/]+/, '/account/orders/:order')
}

export function StorefrontAnalytics({ measurementId, path, routeKey }: { measurementId?: string | null; path: string; routeKey: string }) {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => readCookiePreferences()?.analytics ?? false)

  useEffect(() => {
    const syncConsent = () => setAnalyticsAllowed(readCookiePreferences()?.analytics ?? false)
    const handleConsent = (event: Event) => {
      const next = (event as CustomEvent<{ analytics?: boolean }>).detail
      setAnalyticsAllowed(next?.analytics === true)
    }
    window.addEventListener('storage', syncConsent)
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsent)
    return () => {
      window.removeEventListener('storage', syncConsent)
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsent)
    }
  }, [])

  useEffect(() => {
    if (!measurementId || !validMeasurementId(measurementId)) return
    if (!analyticsAllowed) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
      return
    }

    initializeGoogleAnalytics(measurementId)
    const safePath = normalizedPagePath(path)
    const frame = window.requestAnimationFrame(() => {
      window.gtag?.('event', 'page_view', { page_path: safePath, page_location: `${window.location.origin}${safePath}`, page_title: document.title })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [analyticsAllowed, measurementId, path, routeKey])

  useEffect(() => {
    const handleAnalyticsEvent = (event: Event) => {
      if (!analyticsAllowed || !measurementId || !validMeasurementId(measurementId)) return
      const detail = (event as CustomEvent<AnalyticsEventDetail>).detail
      if (detail && ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'].includes(detail.name)) {
        window.gtag?.('event', detail.name, detail.parameters)
      }
    }
    window.addEventListener(STOREFRONT_ANALYTICS_EVENT, handleAnalyticsEvent)
    return () => window.removeEventListener(STOREFRONT_ANALYTICS_EVENT, handleAnalyticsEvent)
  }, [analyticsAllowed, measurementId])

  return null
}
