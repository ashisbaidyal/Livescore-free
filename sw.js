const STATIC_CACHE = "lsf-static-v19";
const DATA_CACHE = "lsf-data-v18";
const APP_SHELL = [
  "/index.html",
  "/ipl.html",
  "/live.html",
  "/upcoming.html",
  "/results.html",
  "/trending.html",
  "/news.html",
  "/blog_hub.html",
  "/blog_article.html",
  "/leagues.html",
  "/players.html",
  "/teams.html",
  "/team.html",
  "/player.html",
  "/standings.html",
  "/match.html",
  "/upcoming_match_detail.html",
  "/info.html",
  "/manifest.webmanifest",
  "/offline.html",
  "/js/script.js?v=1.0.19",
  "/js/ipl-hub.js?v=1.0.17",
  "/css/runtime-enhancements.css",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/hero-fallback.svg",
  "/public/logo.png",
  "/public/hero-fallback.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline.html")))
    );
    return;
  }

  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/index.html";
  event.waitUntil(clients.openWindow(url));
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}




