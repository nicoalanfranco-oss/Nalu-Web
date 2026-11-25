const BUILD_TIMESTAMP = '1795643542080';
const CACHE_NAME = `nalu-poke-${BUILD_TIMESTAMP}`;

const STATIC_ASSETS = [
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/Logo_nalu.PNG',
  '/Logo_nalu-sinfondo.png',
  '/hero_nalu_square.jpg',
  '/hero_nalu_nueva.jpg',
  '/hero_bandejas_nalu.jpg',
  '/tray_proteinas.jpg',
  '/tray_vegetales.jpg',
  '/tray_bases.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Guardar index.html sin usar caché HTTP como respaldo offline
      try {
        const indexReq = new Request('/index.html', { cache: 'no-store' });
        const indexRes = await fetch(indexReq);
        if (indexRes && indexRes.ok) {
          await cache.put('/index.html', indexRes);
        }
      } catch (err) {
        console.warn('[SW] No se pudo pre-cachear index.html:', err);
      }

      await Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch((err) => console.warn('[SW] Cache miss for', url, err)))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando cache anterior:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function sanitizeNavigationResponse(response) {
  if (!response || !response.redirected) {
    return response;
  }
  const cloned = response.clone();
  return new Response(cloned.body, {
    status: cloned.status,
    statusText: cloned.statusText,
    headers: cloned.headers,
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and non-HTTP(S)
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Nunca interceptar endpoints de la API, version.json ni sw.js
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('hosted.app') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/sw.js')
  ) {
    return;
  }

  // Navegación (HTML / SPA entry): Network-First saltando caché HTTP con fallback offline a /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(event.request.url, { cache: 'no-store' }))
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return sanitizeNavigationResponse(networkResponse);
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // manifest.json: Network-First para reflejar cambios de PWA
  if (url.pathname.endsWith('/manifest.json')) {
    event.respondWith(
      fetch(new Request(event.request.url, { cache: 'no-store' }))
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets compilados por Vite con hash en el nombre (/assets/...): Cache-First seguro
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Ingredientes e imágenes estáticas: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/ingredients/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.PNG') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Resto de recursos: Network-First con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok && url.origin === self.location.origin) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
