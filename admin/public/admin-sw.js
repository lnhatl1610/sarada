self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = { body: event.data?.text() ?? '' } }
  const title = payload.title || 'Sarada'
  const options = {
    body: payload.body || '',
    ...(payload.icon ? { icon: payload.icon } : {}),
    ...(payload.badge ? { badge: payload.badge } : {}),
    data: payload.data || {},
    tag: payload.tag,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const requested = event.notification.data?.url || '/'
  const target = new URL(requested, self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((windowClient) => new URL(windowClient.url).origin === target.origin)
    if (existing) return existing.navigate(target.href).then(() => existing.focus())
    return clients.openWindow(target.href)
  }))
})
