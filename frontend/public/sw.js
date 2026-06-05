const CACHE_NAME = 'prashnasarathi-pwa-cache-v1';
const DATA_CACHE_NAME = 'prashnasarathi-data-cache-v1';

// Static files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/faqs',
  '/questions',
  '/guidelines',
  '/logo.png',
  '/pwa/icons/icon-72x72.png',
  '/pwa/icons/icon-96x96.png',
  '/pwa/icons/icon-128x128.png',
  '/pwa/icons/icon-144x144.png',
  '/pwa/icons/icon-152x152.png',
  '/pwa/icons/icon-192x192.png',
  '/pwa/icons/icon-384x384.png',
  '/pwa/icons/icon-512x512.png',
  '/favicon.ico',
  '/icon.png'
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-first for static assets, network-first for APIs/dynamic contents
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API Requests (FAQs, search, categories, user details, etc.)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is valid, clone and store it in data cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback from data cache
          return caches.match(request);
        })
    );
    return;
  }

  // Handle Next.js Static Files and Page Assets (Cache-First, fallback to Network)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache range responses, external fonts, or non-ok responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // If page navigation fails (offline and not in cache), return main page
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});

// Push Notification Listeners (Merged from push-service-worker.js)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'PrashnaSārathi';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon.png',
      badge: data.badge || '/badge.png',
      tag: data.tag || 'notification',
      data: data.data || {},
      requireInteraction: false,
      silent: false,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[Service Worker] Error displaying push notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link;
  if (link) {
    event.waitUntil(
      clients.openWindow(link)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  }
});
