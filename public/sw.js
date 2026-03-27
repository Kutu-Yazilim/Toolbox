const CACHE_NAME = "toolbox-v2"
const PRECACHE_URLS = ["/"]

// Install: precache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first strategy with cache fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== "GET") return
  if (event.request.url.startsWith("chrome-extension")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // Only serve cached root page for navigations, never for
          // sub-resources (JS/CSS) — otherwise HTML gets parsed as JS
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }
          return undefined
        })
      })
  )
})
