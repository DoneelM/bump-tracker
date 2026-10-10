/*
 * Bump Tracker service worker: cache-first app shell for offline use.
 *
 * - Only same-origin GET requests are handled; everything else goes straight to the network.
 * - Bump CACHE_VERSION when changing this file's caching behaviour; old caches are
 *   deleted on activate.
 * - Navigations are served from cache first and refreshed in the background, so a
 *   new deploy is picked up on the next launch. Hashed build assets are immutable,
 *   so cache-first is always safe for them.
 * - No user data passes through here: it lives in localStorage/IndexedDB.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `bump-tracker-${CACHE_VERSION}`;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-maskable.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('bump-tracker-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheable(response) {
  return response && response.ok && response.type === 'basic';
}

async function fetchAndCache(request, cacheKey) {
  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // The app is a single page with hash routing, so every navigation is the shell.
    const shellUrl = new URL('./index.html', self.registration.scope).href;
    event.respondWith(
      caches.match(shellUrl).then((cached) => {
        const refresh = fetchAndCache(request, shellUrl).catch(() => undefined);
        if (cached) {
          event.waitUntil(refresh);
          return cached;
        }
        return refresh.then((res) => res || Response.error());
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetchAndCache(request, request)),
  );
});
