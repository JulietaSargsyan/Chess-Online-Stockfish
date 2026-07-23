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
const VERSION = 'v3';
const CACHE = `chess-offline-${VERSION}`;

// Everything is resolved relative to the worker's own location, so the app works
// whether it's served from the domain root or a project subpath (GitHub Pages).
const BASE = new URL('./', self.location.href).href;
const INDEX_URL = BASE + 'index.html';

// Assets known up front. Hash-named build bundles (assets/*.js, *.css) can't be
// listed here, so they're cached at runtime on first load (see the fetch handler).
const PRECACHE_URLS = [
  BASE,
  INDEX_URL,
  BASE + 'stockfish.js',
  BASE + 'stockfish.wasm',
  BASE + 'stockfish.worker.js',
  BASE + 'sounds/move.mp3',
  BASE + 'sounds/capture.mp3',
  BASE + 'favicon.png',
];

// Precache the known assets, then the hash-named build bundles that index.html
// references. Their names aren't known up front, and on a first visit the worker
// isn't controlling the page yet when they load — so without this they'd be
// missed, and going offline before a second visit would show a blank page.
async function precacheAll() {
  const cache = await caches.open(CACHE);
  await cache.addAll(PRECACHE_URLS);

  try {
    const indexResponse = (await cache.match(INDEX_URL)) || (await fetch(INDEX_URL));
    const html = await indexResponse.text();
    const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
      .map((match) => new URL(match[1], INDEX_URL).href)
      .filter((url) => url.startsWith(BASE) && !PRECACHE_URLS.includes(url));

    if (assetUrls.length) await cache.addAll(assetUrls);
  } catch {
    // Non-fatal: those bundles just get cached at runtime on first fetch instead.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAll().then(() => self.skipWaiting()));
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
          caches.open(CACHE).then((cache) => cache.put(INDEX_URL, copy));
          return withCoiHeaders(response);
        })
        .catch(() =>
          caches
            .match(INDEX_URL, { ignoreVary: true })
            .then((cached) => (cached ? withCoiHeaders(cached) : Response.error()))
        )
    );
    return;
  }

  // Everything else (engine wasm/worker, JS/CSS bundles, sounds, icon):
  // cache-first, populating the cache on first successful fetch.
  //
  // ignoreVary matters: hosts commonly serve assets with `Vary: Origin`, and the
  // module bundle is requested with `crossorigin` (so it sends an Origin header
  // the precached entry lacks). Honouring Vary would miss the cache and fail
  // offline — which left the app a blank page.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => {
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
