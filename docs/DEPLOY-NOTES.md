# Deploy notes

The app is a static build (`npm run build` → `dist/`). It has no backend. Read this before the first public deploy.

## Not done yet: security review M3 (deploy headers and a dedicated origin)

Deferred on purpose. Do both of these before a public deploy.

1. **Use a dedicated origin.** That means a custom (sub)domain or a host the app has to itself. Do **not** use a shared origin such as `doneelm.github.io/bump-tracker/`. localStorage, IndexedDB and service worker scope are per-origin, not per-path. Every other page on a shared origin could read the health data and photos, or register an overlapping service worker.
2. **Send real security headers.** A `<meta>` CSP can't set `frame-ancestors` or the other headers. The header set (backend design v3, §3) lives in [`scripts/_headers`](../scripts/_headers), in Cloudflare `_headers` syntax; task H1 moves it to `public/_headers`. `npm run check:offline` serves the build with exactly these headers and fails on any CSP or Trusted Types violation.

   `camera=()` is fine because photo capture uses the OS picker (`<input capture>`), not `getUserMedia`.
   Blob URLs cover the photos, so the header CSP has no `data:`.

## Caching

- `sw.js` must **not** be served with a long `Cache-Control` lifetime. Browsers re-check it on navigation, and each deploy ships a byte-different `sw.js`. `no-cache` is ideal.
- `assets/*` file names are content-hashed, so they can be cached long-term (`immutable`).
- After `vite build`, `scripts/sw-precache.mjs` writes the full file list and a content hash into `dist/sw.js`. It is part of `npm run build`, so don't deploy the output of a bare `vite build`.
- A tab left open across a deploy can lose its old lazy chunks (e.g. the chart) when the new worker activates and deletes the old cache. Offline, that tab shows the recovery screen, and **Reload** fixes it because the new shell is cached. This is accepted.
- End-to-end check, offline and under the security headers (Playwright is deliberately not a devDependency, to keep installs small; install it ad hoc, and don't wire this into CI as is): `npm run build && npm i --no-save playwright && npx playwright install chromium && npm run check:offline`.
