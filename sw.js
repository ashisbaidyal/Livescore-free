const CACHE_NAME = "lsf-v42";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/api-config.js",
  "/app.js",
  "/manifest.json",
  "/logo-day.svg",
  "/logo-night.svg",
  "/logo.svg",
  "/logo-mark.svg",
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  const isApiCall = requestUrl.hostname.includes("espn.com") || requestUrl.hostname.includes("thesportsdb.com");

  if (isApiCall) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
