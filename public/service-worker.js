// Service Worker for Energy Price Germany PWA
// Version: 1.1.0 - Auto-update: Removed manual update notifications, updates apply automatically

const CACHE_VERSION = '1.3.0';
const BUILD_DATE = '2026-01-05';
const CACHE_NAME = `energy-price-germany-v${CACHE_VERSION}-${BUILD_DATE}`;
const urlsToCache = [
  '/Energy_Price_Germany/',
  '/Energy_Price_Germany/index.html',
  '/Energy_Price_Germany/manifest.json',
  '/Energy_Price_Germany/icon-192.png',
  '/Energy_Price_Germany/icon-512.png',
];

// Install event - cache essential files

// Force update on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and force update
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - Network First strategy for data, Cache First for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network First for marketdata.json (always fresh data)
  // Use flexible pattern matching for any cache-busting version
  if (url.pathname.includes('/data/marketdata.json?v=1767645116903')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone response because it can only be consumed once
          const responseClone = response.clone();

          // Update cache with fresh data
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Network First for index.html (CRITICAL: always get latest HTML with correct JS hash)
  if (url.pathname.includes('index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Network First for JavaScript bundles (to get updates quickly)
  if (url.pathname.includes('.js') && !url.pathname.includes('service-worker')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First for static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-GET requests or non-successful responses
          if (event.request.method !== 'GET' || !response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
