# Deploy notes

The app is a static build (`npm run build` → `dist/`). It has no backend. Read this before the first public deploy.

## Cloudflare (Workers Builds)

The app deploys to Cloudflare Workers as static assets only (no Worker script). `wrangler.jsonc` points Wrangler at `dist/`. Every push to `main` builds, tests and deploys automatically through Cloudflare's Git integration. No Cloudflare token is stored in GitHub.

**One-time setup in the Cloudflare dashboard:**

1. Go to **Workers & Pages** → **Create application** → **Import a repository**.
2. Pick the GitHub account and `DoneelM/bump-tracker`. The first time, Cloudflare asks to install its GitHub app on the repo.
3. Use these settings. The Worker name must match `name` in `wrangler.jsonc`, or the build fails.

   | Setting | Value |
   | --- | --- |
   | Project / Worker name | `bump-tracker` |
   | Production branch | `main` |
   | Build command | `npm test && npm run build` |
   | Deploy command | `npm run deploy` |
   | Root directory | leave empty |

4. **Save and Deploy.** The app is served at `https://bump-tracker.<your-subdomain>.workers.dev`.

**Notes on the setup:**

- **Dependencies:** Workers Builds installs them from `package-lock.json` before the build command. Tests run before every build, so a failing test stops the deploy.
- **Wrangler version:** `npm run deploy` runs a pinned Wrangler (`npx -y wrangler@4.141.0 deploy`) instead of a devDependency, to keep installs small. `compatibility_date` in `wrangler.jsonc` must be a date that Wrangler version supports; 4.141.0 rejects anything after 2026-10-02.
- **Telemetry:** `send_metrics: false` turns off Wrangler's anonymous usage telemetry.
- **Checking a change locally:** run `npm run build && npx -y wrangler@4.141.0 dev` to serve `dist/` with Cloudflare's runtime, `_headers` included.
- **Preview builds for other branches** are optional (Worker → **Settings** → **Builds**). Each preview gets its own URL, which is a separate origin, so it has separate storage.
- **Cloudflare behaviours the app relies on:**
  - Cloudflare answers `/index.html` with a 307 to `/`. `sw.js` serves that redirected cached copy as a clean response (#3).
  - Cloudflare returns 404 for `/_headers`, so it is never precached (#4).

## Security: dedicated origin and headers (review item M3)

1. **Dedicated origin: done.** The `workers.dev` hostname belongs to this Worker alone. A custom domain or subdomain works too. Do **not** move the app to a shared origin such as `doneelm.github.io/bump-tracker/`. localStorage, IndexedDB and service worker scope are per-origin, not per-path. Every other page on a shared origin could read the health data and photos, or register an overlapping service worker.
2. **Security headers: done**, in [`public/_headers`](../public/_headers) (Cloudflare syntax). Vite copies the file to `dist/`; Cloudflare applies it and doesn't serve it.
   - **CSP:** the header CSP matches the `<meta>` CSP in `vite.config.ts`, plus `frame-ancestors 'none'`, which a meta tag can't set. Keep the two in sync.
   - **Other headers:** HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and COOP.
   - **`camera=()`** is fine because photo capture uses the OS picker (`<input capture>`), not `getUserMedia`.
   - **`img-src data:`** is still allowed, to match the meta CSP. Check whether it's still needed; blob URLs cover the photos.

## Caching

- `sw.js` must **not** be served with a long `Cache-Control` lifetime. Browsers re-check it on navigation, and each deploy ships a byte-different `sw.js`. `_headers` sends `no-cache` for it.
- `assets/*` file names are content-hashed, so `_headers` caches them long-term (`immutable`).
- After `vite build`, `scripts/sw-precache.mjs` writes the full file list and a content hash into `dist/sw.js`. It is part of `npm run build`, so don't deploy the output of a bare `vite build`.
- The precache list is an allowlist: `index.html`, `manifest.webmanifest`, and `assets/`, `icons/` and `images/` (no dotfiles). Host config such as `_headers` stays out, because hosts don't serve it and one missing file fails the worker install. Every file in `dist/`, `_headers` included, still counts towards the worker version, so a header-only change ships a new worker and pages it serves from cache pick up the new headers. If you add a new top-level folder the app loads, add it to `DIRS` in `scripts/sw-precache.mjs`.
- A tab left open across a deploy can lose its old lazy chunks (e.g. the chart) when the new worker activates and deletes the old cache. Offline, that tab shows the recovery screen, and **Reload** fixes it because the new shell is cached. This is accepted.
- End-to-end offline check (Playwright is deliberately not a devDependency, to keep installs small; install it ad hoc, and don't wire this into CI as is): `npm run build && npm i --no-save playwright && npx playwright install chromium && npm run check:offline`.
