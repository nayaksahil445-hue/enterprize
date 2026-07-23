const CACHE_NAME = 'jagannath-ent-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event: cache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: cache-first for static, network-first for pages
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests and external API requests (except local domain)
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle same-origin requests
  if (requestUrl.origin === self.location.origin) {
    // 1. Static Assets (CSS, JS, Fonts, Images, SVGs) -> Cache First, fall back to network
    const isStaticAsset = (
      requestUrl.pathname.includes('/src/') ||
      requestUrl.pathname.includes('/assets/') ||
      requestUrl.pathname.includes('/images/') ||
      requestUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|eot|ttf|otf)$/)
    );

    if (isStaticAsset) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
      );
      return;
    }

    // 2. HTML/Pages or local GET APIs -> Network First, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid response, update dynamic cache
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails (offline), try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Offline fallback for HTML requests
            if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
        })
    );
  }
});
