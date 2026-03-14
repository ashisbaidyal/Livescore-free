const CACHE_NAME = "lsf-v46";
const CACHE_VERSION = "v46";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/api-config.js",
  "/app.js",
  "/manifest.json",
  "/logo-day.png",
  "/logo-night.png",
  "/logo.png",
  "/logo-mark.png",
  "/logo-mark-512.png",
  "/logo-mark-192.png",
  "/logo-mark-180.png",
  "/logo-mark-32.png",
  "/logo-mark-16.png",
  "/favicon-share.svg",
  "/favicon-link.svg",
  "/favicon-whatsapp.svg",
  "/favicon-telegram.svg",
  "/favicon-x.svg",
  "/favicon-facebook.svg",
  "/favicon-linkedin.svg",
  "/favicon-reddit.svg",
  "/favicon-email.svg",
  "/bg-stadium-night-1.svg",
  "/bg-stadium-night-2.svg",
  "/bg-stadium-night-3.svg",
  "/bg-stadium-night-4.svg",
  "/bg-stadium-day-1.svg",
  "/bg-stadium-day-2.svg",
  "/bg-stadium-day-3.svg",
  "/bg-stadium-day-4.svg",
  "/sport-football.svg",
  "/sport-cricket.svg",
  "/sport-basketball.svg",
  "/sport-tennis.svg",
  "/sport-nfl.svg",
  "/sport-hockey.svg",
  "/sport-baseball.svg",
  "/sport-rugby.svg",
  "/sport-mma.svg",
  "/sport-f1.svg",
  "/sport-default.svg",
  "/robots.txt",
  "/sitemap.xml"
];

// Log service worker activation
console.debug(`[SW] LiveScoreFree Service Worker ${CACHE_VERSION} loading`);

self.addEventListener("install", (event) => {
  console.debug(`[SW] Installing ${CACHE_NAME}...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.debug(`[SW] Caching ${APP_SHELL.length} app shell items`);
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.debug(`[SW] Installation complete, skipping waiting`);
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error(`[SW] Installation failed:`, error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.debug(`[SW] Activating ${CACHE_NAME}...`);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        console.debug(`[SW] Found caches:`, keys);
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key.startsWith('lsf-'))
            .map((key) => {
              console.debug(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.debug(`[SW] Claim all clients`);
        return self.clients.claim();
      })
      .catch((error) => {
        console.error(`[SW] Activation failed:`, error);
      })
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Check if it's an external API call
  const isApiCall = requestUrl.hostname.includes("espn.com") || requestUrl.hostname.includes("thesportsdb.com");
  
  // Network-first strategy for API calls
  if (isApiCall) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            throw new Error(`HTTP ${response?.status}`);
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch((error) => {
          console.debug(`[SW] Network failed for ${requestUrl.pathname}, using cache:`, error.message);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for app shell
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            throw new Error(`HTTP ${response?.status}`);
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch((error) => {
          console.debug(`[SW] Request failed for ${requestUrl.pathname}:`, error.message);
          return caches.match("/index.html");
        })
    )
  );
});
