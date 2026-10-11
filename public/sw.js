/*
 * Bump Tracker service worker: offline app shell.
 *
 * After `vite build`, scripts/sw-precache.mjs (part of `npm run build`) fills PRECACHE with every file in dist/
 * and VERSION with a content hash, so each deploy is a new worker with its own cache.
 * The new worker caches ALL of its files before it activates, so it never serves an
 * index.html whose bundles are missing. Old caches are deleted on activate.
 * Only same-origin GETs are handled. No user data passes through here.
 */
const VERSION = 'dev';
const PRECACHE = []; // filled in by scripts/sw-precache.mjs
const CACHE_NAME = `bump-tracker-${VERSION}`;
const SHELL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE.map((path) => new Request(path, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bump-tracker-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // Hash routing: every navigation is the shell.
  const key = request.mode === 'navigate' ? SHELL : request;
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(key, { ignoreSearch: request.mode === 'navigate', ignoreVary: true })).then((hit) => (hit ? unredirect(hit) : fetch(request))),
  );
});

// Hosts like Cloudflare answer ./index.html with a redirect to ./, so the cached shell is a
// redirected response. Browsers reject those for navigations (ERR_FAILED), so serve a clean copy.
function unredirect(res) {
  if (!res.redirected) return res;
  return res.blob().then((body) => new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }));
}
