// Service Worker Disabled
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear any existing caches immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// No fetch handler -> Network only
