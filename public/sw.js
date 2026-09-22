/* Little Internet service worker — network-first pages, cache-first static assets. */
const CACHE_VERSION = 'li-v1'
const PRECACHE = `${CACHE_VERSION}-precache`
const RUNTIME = `${CACHE_VERSION}-runtime`

const PRECACHE_URLS = ['/', '/~offline', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== PRECACHE && key !== RUNTIME)
            .map(key => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isApiOrAuth(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/account')
  )
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/LOGO/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  )
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME)
  try {
    const response = await fetch(request)
    if (response && response.ok && request.method === 'GET') {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      const offline = await caches.match('/~offline')
      if (offline) return offline
    }
    throw new Error('offline')
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.ok && request.method === 'GET') {
    const cache = await caches.open(RUNTIME)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isApiOrAuth(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
  }
})
