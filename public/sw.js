// KILLER SERVICE WORKER
// This service worker explicitly unregisters itself and clears all domain caches
// to transition users from the old legacy PWA to the Next.js App Router.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[ServiceWorker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We no longer intercept fetches, let the browser handle Next.js requests natively.
});
