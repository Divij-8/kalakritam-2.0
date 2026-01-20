// Optimized Service Worker v4 - Professional chunk caching
// Intelligent caching based on chunk type and usage patterns

const CACHE_NAME = 'kalakritam-v4';
const RUNTIME_CACHE = 'kalakritam-runtime-v4';

// Critical assets that should be cached immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install - precache critical assets
self.addEventListener('install', (event) => {
  console.log('SW v4: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW v4: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes('v4'))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Intelligent caching strategy based on resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external resources entirely - let browser handle them
  if (url.hostname !== self.location.hostname) {
    return;
  }
  
  // Skip API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // For hashed assets (contain hash in filename) - Cache first, immutable
  if (url.pathname.includes('/assets/') && url.pathname.match(/-[A-Za-z0-9]{8}\./)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
  
  // For images - Cache first with network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Return placeholder for failed images
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }
  
  // For fonts - Cache first (immutable)
  if (request.destination === 'font' || url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // For navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }
  
  // Default: Network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
