/* Singapore Club Operations service worker.
 *
 * Scope: make the app launchable and keep the shell readable with no
 * connection. Data is deliberately not cached here — the API answers to Clerk
 * and Postgres, so a cached JSON response would be stale money and stale
 * stock. Orders are the one thing a bar cannot lose, and the honest answer
 * for offline orders is a local queue on the device, not a service worker.
 */

const VERSION = 'sc-v1'
const SHELL_CACHE = `${VERSION}-shell`
const RUNTIME_CACHE = `${VERSION}-runtime`

/* The minimum needed to paint the sign-in screen offline. Navigations to any
 * app route fall back to the cached sign-in shell when the network is gone. */
const SHELL_URLS = ['/sign-in', '/offline']

/* Never intercept these: they carry auth, money and stock. */
const BYPASS = [
  '/api/',
  '/_next/webpack-hmr',
  '/__nextjs',
  '/v1/',
  '/v2/',
  '/users/',
  '/oauth/',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isBypass(url) {
  return BYPASS.some((path) => url.pathname.startsWith(path))
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isBypass(url)) return

  /* Navigations: network first so staff see live data, cache as the fallback
   * so a cold start with no WiFi still opens the app rather than the browser's
   * dinosaur. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const shell = await caches.match('/sign-in')
          if (shell) return shell
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
              '<body style="font-family:system-ui;background:#0d0e0b;color:#f7f4ed;' +
              'display:grid;place-items:center;height:100vh;margin:0;text-align:center">' +
              '<div><h1 style="font-size:1.2rem;margin:0 0 .5rem">No connection</h1>' +
              '<p style="color:#b9b6ad;margin:0">Singapore Club Operations needs a network to load.</p></div>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          )
        }),
    )
    return
  }

  /* Static build output: cache first, it is content-hashed and immutable. */
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
      }),
    )
  }
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
