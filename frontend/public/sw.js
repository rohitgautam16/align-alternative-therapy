const STATIC_CACHE = "align-static-v1";
const RUNTIME_CACHE = "align-runtime-v1";

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = ["/", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only same-origin
  if (url.origin !== self.location.origin) return;

  // Don’t cache APIs, admin, or audio streams
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.match(/\.(mp3|wav|ogg)$/i)
  ) {
    return;
  }

  // Navigation requests – network first, fallback to offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match(OFFLINE_URL);
          return cached || new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets – stale-while-revalidate
  if (
    ["style", "script", "image", "font"].includes(request.destination) ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?)$/i)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);

        const networkPromise = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })()
    );
  }
});