/**
 * Bubu Study Timer - Service Worker
 *
 * Strategy:
 *   - HTML (navigation): network-first, fall back to cache when offline.
 *     Ensures users always get the latest UI when online, but app still loads when offline.
 *   - Static assets (CSS/JS/SVG/fonts): stale-while-revalidate.
 *     Instant load from cache, refresh in background for next visit.
 *   - Firebase / Google APIs: bypassed entirely so realtime sync is never cached.
 *
 * Bump CACHE_VERSION whenever you ship a breaking change to assets.
 */

const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `bubu-timer-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './sounds/alert.mp3',
];

// Schemes/hosts we never cache
const BYPASS_SCHEMES = ['chrome-extension:', 'chrome:', 'moz-extension:'];
const BYPASS_HOSTS = [
  'firebaseio.com',
  'firebasedatabase.app',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com/firebasejs',
  'google-analytics.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
        // If one URL fails (e.g. font CDN hiccup) don't block install
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function shouldBypass(url) {
  try {
    const parsed = new URL(url);
    if (BYPASS_SCHEMES.includes(parsed.protocol)) return true;
  } catch { return true; }
  return BYPASS_HOSTS.some((host) => url.includes(host));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET — never cache POST/PUT/etc.
  if (request.method !== 'GET') return;

  const url = request.url;

  // Bypass Firebase + analytics entirely
  if (shouldBypass(url)) return;

  // Navigation requests (HTML): network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Allow page to trigger immediate SW update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
