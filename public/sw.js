/*
 * Service worker for offline play.
 *
 * The app is meant to work entirely offline, but nothing was caching its
 * assets. It only appeared to work offline by chance of the browser's HTTP
 * cache. As soon as a needed file wasn't cached and the network was down, the
 * lazily-loaded Stockfish engine (stockfish.wasm / stockfish.worker.js) failed
 * to load and the computer stopped moving.
 *
 * This worker precaches the engine and app shell so play never depends on the
 * network, and it re-adds the COOP/COEP headers that cross-origin isolation
 * (required by SharedArrayBuffer, and therefore Stockfish) needs, so isolation
 * survives even when pages are served from cache while offline.
 *
 * Bump VERSION whenever any precached file below (notably the Stockfish build)
 * changes, so clients pick up the new copy.
 */
const VERSION = 'v2';
const CACHE = `chess-offline-${VERSION}`;

// Assets known up front. Hash-named build bundles (/assets/*.js, *.css) can't be
// listed here, so they're cached at runtime on first load (see the fetch handler).
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/stockfish.js',
  '/stockfish.wasm',
  '/stockfish.worker.js',
  '/sounds/move.mp3',
  '/sounds/capture.mp3',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// Re-attach the cross-origin isolation headers so SharedArrayBuffer keeps working
// when responses are served from cache (offline) or from a host that doesn't set
// them. Only same-origin (basic) responses can be safely rewritten.
function withCoiHeaders(response) {
  if (!response || (response.type !== 'basic' && response.type !== 'default')) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GETs; let everything else (e.g. analytics) hit the
  // network and fail harmlessly when offline.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Page navigations: network-first so the app updates when online, with a
  // cached fallback so it still opens offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return withCoiHeaders(response);
        })
        .catch(() =>
          caches
            .match('/index.html')
            .then((cached) => (cached ? withCoiHeaders(cached) : Response.error()))
        )
    );
    return;
  }

  // Everything else (engine wasm/worker, JS/CSS bundles, sounds, icon):
  // cache-first, populating the cache on first successful fetch.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return withCoiHeaders(cached);
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return withCoiHeaders(response);
      });
    })
  );
});
