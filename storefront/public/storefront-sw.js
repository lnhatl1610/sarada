self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('storefront-shell-v1').then((cache) => cache.addAll(['/', '/offline.html', '/manifest.webmanifest'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('storefront-') && !['storefront-shell-v1', 'storefront-pages-v1', 'storefront-public-api-v1', 'storefront-assets-v1'].includes(key))
      .map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()))
})

const privatePage = (pathname) => /^\/(account|cart|checkout|track-order|login|register|reset-password)(\/|$)/.test(pathname)
const publicApiPath = (pathname) => /^\/api\/v1\/(banners|collections|categories|catalog\/filter-options|products|stores|faqs|pages)(\/|$)/.test(pathname)

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)))
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    if (privatePage(url.pathname)) return
    event.respondWith((async () => {
      const cache = await caches.open('storefront-pages-v1')
      try {
        const response = await fetch(request)
        if (response.ok && !/private|no-store/i.test(response.headers.get('cache-control') || '')) {
          await cache.put(request, response.clone())
          await trimCache(cache, 30)
        }
        return response
      } catch {
        return await cache.match(request) || await caches.match('/') || await caches.match('/offline.html')
      }
    })())
    return
  }

  if (publicApiPath(url.pathname) && !request.headers.has('authorization')) {
    event.respondWith((async () => {
      const cache = await caches.open('storefront-public-api-v1')
      try {
        const response = await fetch(request)
        const cacheControl = response.headers.get('cache-control') || ''
        if (response.ok && response.headers.get('content-type')?.includes('application/json') && !/private|no-store/i.test(cacheControl)) {
          await cache.put(request, response.clone())
          await trimCache(cache, 60)
        }
        return response
      } catch {
        return await cache.match(request) || new Response(JSON.stringify({ message: 'Bạn đang ngoại tuyến và nội dung này chưa được lưu trên thiết bị.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }
    })())
    return
  }

  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith((async () => {
      const cache = await caches.open('storefront-assets-v1')
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        await cache.put(request, response.clone())
        await trimCache(cache, 100)
      }
      return response
    })())
  }
})

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = { body: event.data?.text() ?? '' } }
  event.waitUntil(self.registration.showNotification(payload.title || 'Sarada', {
    body: payload.body || '',
    ...(payload.icon ? { icon: payload.icon } : {}),
    ...(payload.badge ? { badge: payload.badge } : {}),
    data: payload.data || {},
    tag: payload.tag,
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => new URL(client.url).origin === target.origin)
    if (existing) return existing.navigate(target.href).then(() => existing.focus())
    return clients.openWindow(target.href)
  }))
})
