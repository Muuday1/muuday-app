const CACHE_NAME = 'muuday-v1'
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  // Activate immediately
  // @ts-ignore
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
    }),
  )
  // @ts-ignore
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API routes and auth
  if (request.url.includes('/api/') || request.url.includes('/auth/')) return

  // Stale-while-revalidate for static assets
  // @ts-ignore
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Network failed — return cached or offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline')
          }
          return cached
        })

      return cached || fetchPromise
    }),
  )
})
