// Daisy Service Worker — handles push notifications

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const title = data.title || 'Daisy 🌼'
  const body = data.body || "I've been thinking about you."
  const icon = '/icon-192.png'
  const badge = '/icon-192.png'
  const url = data.url || '/'

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: 'daisy-nudge',
      renotify: true,
      data: { url },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
