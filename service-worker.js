// Service Worker for Energy Price Germany PWA
// Version: 1.0.0

const CACHE_VERSION = '1.0.0';
const BUILD_DATE = '2025-10-13';
const CACHE_NAME = `energy-price-germany-v${CACHE_VERSION}-${BUILD_DATE}`;
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and force update
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Cache cleaned, claiming clients');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - Network First strategy for data, Cache First for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS Service Worker for external APIs (SMARD, etc.)
  if (url.origin !== self.location.origin) {
    // Let the browser handle external requests directly
    return;
  }

  // Network First for marketdata.json (always fresh data)
  if (url.pathname.includes('/data/marketdata.json?v=1760350930402')) {
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

// Aggressive update checking and auto-reload notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Update notification system
let updatePending = false;

self.addEventListener('updatefound', () => {
  const newWorker = self.registration.installing;

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New version available
      if (!updatePending) {
        updatePending = true;

        // Notify all clients about the update
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              message: 'Eine neue Version ist verfügbar. Seite neu laden?'
            });
          });
        });
      }
    }
  });
});

// Periodic update checks
setInterval(() => {
  self.registration.update();
}, 10000); // Check every 10 seconds
