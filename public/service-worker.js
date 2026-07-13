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
const VOCAB_CACHE_NAME = 'bubu-vocab-images-v1';
const VOCAB_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — matches the Cache-Control set at upload time

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
        keys.filter((k) => k !== CACHE_NAME && k !== VOCAB_CACHE_NAME).map((k) => caches.delete(k))
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

function isVocabImageUrl(url) {
  try {
    return decodeURIComponent(url).includes('/vocab-cards/');
  } catch {
    return url.includes('vocab-cards');
  }
}

async function fetchAndStamp(request, cache, now) {
  const response = await fetch(request);
  if (response && response.status === 200) {
    const headers = new Headers(response.headers);
    headers.set('x-cached-at', String(now));
    const stamped = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    cache.put(request, stamped);
  }
  return response;
}

async function handleVocabImage(request) {
  const cache = await caches.open(VOCAB_CACHE_NAME);
  const cached = await cache.match(request);
  const now = Date.now();

  if (cached) {
    const cachedAt = Number(cached.headers.get('x-cached-at')) || 0;
    if (now - cachedAt < VOCAB_TTL_MS) return cached;
    try {
      return await fetchAndStamp(request, cache, now);
    } catch {
      return cached; // expired but offline — stale is better than nothing
    }
  }

  return fetchAndStamp(request, cache, now);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET — never cache POST/PUT/etc.
  if (request.method !== 'GET') return;

  const url = request.url;

  // Vocab card images: narrow, path-scoped cache-first exception, carved out
  // of the broader googleapis.com bypass below (that bypass exists for
  // Firestore/Auth/RTDB realtime traffic, not static images).
  if (isVocabImageUrl(url)) {
    event.respondWith(handleVocabImage(request));
    return;
  }

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
