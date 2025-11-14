// service-worker.js
const SW_VERSION = 'panchang-v1';
const ASSET_CACHE = `${SW_VERSION}-assets`;
const DATA_CACHE = `${SW_VERSION}-data`;

const ASSETS = [
  '/', // index.html
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// The data file (single source of truth)
const DATA_URL = '/data/dates.json';

// Install: cache shell assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(ASSET_CACHE).then(cache => cache.addAll(ASSETS))
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![ASSET_CACHE, DATA_CACHE].includes(k)).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - For dates.json: stale-while-revalidate (serve cache if available, update in background).
// - For other navigation/asset requests: cache-first (fall back to network).
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Handle data file with stale-while-revalidate
  if (url.pathname === DATA_URL) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Navigation requests -> serve index.html (app shell) from cache first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      caches.match('/index.html').then(resp => resp || fetch(req))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(networkResp => {
      // populate cache for future
      return caches.open(ASSET_CACHE).then(cache => {
        // avoid caching opaque responses like cross-origin images without CORS
        try { cache.put(req, networkResp.clone()); } catch (e) {}
        return networkResp;
      });
    }).catch(() => cached))
  );
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(req);
  const fetchAndUpdate = fetch(req).then(networkResp => {
    if(networkResp && networkResp.ok) cache.put(req, networkResp.clone());
    return networkResp;
  }).catch(() => null);

  // Return cached immediately if present, otherwise wait for network
  return cached || (await fetchAndUpdate) || new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' }
  });
}