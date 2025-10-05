const CACHE_NAME = 'energy-price-germany-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/manifest.json',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Ignore errors during cache population
        console.log('Cache population failed, continuing anyway');
      });
    })
  );
});

// Activate Service Worker
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
  );
});

// Fetch from cache, but allow external API calls
self.addEventListener('fetch', (event) => {
  // Don't intercept external API calls
  if (event.request.url.includes('api.energy-charts.info')) {
    return; // Let the browser handle it
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch((error) => {
      console.error('Fetch failed:', error);
      throw error;
    })
  );
});
