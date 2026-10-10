# Deploy notes

The app is a static build (`npm run build` → `dist/`). It has no backend. Read this before the first public deploy.

## Not done yet: security review M3 (deploy headers and a dedicated origin)

Deferred on purpose. Do both of these before a public deploy.

1. **Use a dedicated origin.** That means a custom (sub)domain or a host the app has to itself. Do **not** use a shared origin such as `doneelm.github.io/bump-tracker/`. localStorage, IndexedDB and service worker scope are per-origin, not per-path. Every other page on a shared origin could read the health data and photos, or register an overlapping service worker.
2. **Send real security headers.** A `<meta>` CSP can't set `frame-ancestors` or the other headers below. Configure them for the chosen host, e.g. `public/_headers` (Netlify / Cloudflare Pages) or `vercel.json`:

   ```
   Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Referrer-Policy: no-referrer
   Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   Cross-Origin-Opener-Policy: same-origin
   ```

   `camera=()` is fine because photo capture uses the OS picker (`<input capture>`), not `getUserMedia`.
   Check whether `img-src data:` is still needed. Blob URLs cover the photos.

## Caching

- `sw.js` must **not** be served with a long `Cache-Control` lifetime. Browsers re-check it on navigation, and each deploy ships a byte-different `sw.js`. `no-cache` is ideal.
- `assets/*` file names are content-hashed, so they can be cached long-term (`immutable`).
- After `vite build`, `scripts/sw-precache.mjs` writes the full file list and a content hash into `dist/sw.js`. It is part of `npm run build`, so don't deploy the output of a bare `vite build`.
- End-to-end offline check: `npm run build && npm i --no-save playwright && npx playwright install chromium && npm run check:offline`.
