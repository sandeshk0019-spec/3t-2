// 3T Dairy & Farmer Passbook PWA Service Worker
const CACHE_NAME = '3t-dairy-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[3T SW] Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // API endpoints must ALWAYS be fresh network-only (never cached)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network first strategy with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Optionally cache static assets like images, scripts, styles
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes('/_next/static/') ||
           event.request.url.endsWith('.png') ||
           event.request.url.endsWith('.jpg') ||
           event.request.url.endsWith('.ico'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
