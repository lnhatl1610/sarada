import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const CACHE_NAME = 'storefront-public-api-v1'
const CACHEABLE_PATH = /^\/api\/v1\/(?:banners|collections(?:\/[^/]+)?|categories|catalog\/filter-options|products(?:\/[^/]+)?|stores|faqs|pages(?:\/[^/]+)?)$/

function requestURL(config: Pick<InternalAxiosRequestConfig, 'url' | 'baseURL' | 'params' | 'paramsSerializer'>): URL {
  return new URL(axios.getUri(config as AxiosRequestConfig))
}

export function isPublicOfflineRead(config: Pick<InternalAxiosRequestConfig, 'url' | 'baseURL' | 'method'>): boolean {
  if (config.method?.toLowerCase() !== 'get' || typeof window === 'undefined') return false
  try {
    return CACHEABLE_PATH.test(requestURL(config).pathname)
  } catch {
    return false
  }
}

function syntheticRequest(url: string): Request {
  const key = new URL('/__offline-api-cache__/', window.location.origin)
  key.searchParams.set('source', url)
  return new Request(key.toString())
}

export async function storePublicResponse(response: AxiosResponse): Promise<void> {
  if (!isPublicOfflineRead(response.config) || response.config.headers.get('Authorization')) return
  if (typeof caches === 'undefined' || !response.status || response.status < 200 || response.status >= 300) return
  if (/private|no-store/i.test(String(response.headers['cache-control'] ?? ''))) return

  try {
    const cache = await caches.open(CACHE_NAME)
    const url = requestURL(response.config).toString()
    await cache.put(syntheticRequest(url), new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }))
    const keys = await cache.keys()
    await Promise.all(keys.slice(0, Math.max(0, keys.length - 80)).map((key) => cache.delete(key)))
  } catch {
    // Offline storage is an enhancement; private browsing/quota limits must not break the request.
  }
}

export async function readPublicResponseOffline(error: AxiosError): Promise<AxiosResponse | null> {
  const config = error.config
  const isUnavailable = !error.response || [502, 503, 504].includes(error.response.status)
  if (!config || !isUnavailable || config.signal?.aborted || !isPublicOfflineRead(config) || config.headers.get('Authorization')) return null
  if (typeof caches === 'undefined' || typeof window === 'undefined') return null

  try {
    const cache = await caches.open(CACHE_NAME)
    const url = requestURL(config).toString()
    const cached = await cache.match(syntheticRequest(url))
    if (!cached) return null

    return {
      data: await cached.json(),
      status: 200,
      statusText: 'OK (offline cache)',
      headers: { 'content-type': 'application/json' },
      config,
      request: error.request,
    }
  } catch {
    return null
  }
}
