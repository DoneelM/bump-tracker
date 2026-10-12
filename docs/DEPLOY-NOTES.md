# Deploy notes

The app is a static build (`npm run build` → `dist/`). It has no backend. Optional sync talks straight from the browser to the user's own Google Drive. Read this before the first public deploy.

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

   Add one build variable: `VITE_GOOGLE_CLIENT_ID` = `626836380740-79lmpemmqhe936isbhd9k2m75bbpjtj1.apps.googleusercontent.com` (see "Google Drive sync" below). Without it the app builds with sync turned off.
4. **Custom domain.** `wrangler.jsonc` routes `bump-tracker.aiagents.nz` to the Worker as a Custom Domain. For that, `aiagents.nz` must be an **active zone in the same Cloudflare account** (its nameservers pointing to Cloudflare), and `bump-tracker.aiagents.nz` must not already have a CNAME record. Cloudflare then creates the DNS record and certificate. **Until the zone is active, `wrangler deploy` fails**, so set the zone up first, or remove `routes` from `wrangler.jsonc` to deploy on `workers.dev` only.
5. **Save and Deploy.** The app is served at `https://bump-tracker.aiagents.nz`.

**Notes on the setup:**

- **Dependencies:** Workers Builds installs them from `package-lock.json` before the build command. Tests run before every build, so a failing test stops the deploy.
- **Wrangler version:** `npm run deploy` runs a pinned Wrangler (`npx -y wrangler@4.141.0 deploy`) instead of a devDependency, to keep installs small. `compatibility_date` in `wrangler.jsonc` must be a date that Wrangler version supports; 4.141.0 rejects anything after 2026-10-02.
- **Telemetry:** `send_metrics: false` turns off Wrangler's anonymous usage telemetry.
- **Checking a change locally:** run `npm run build && npx -y wrangler@4.141.0 dev` to serve `dist/` with Cloudflare's runtime, `_headers` included.
- **Preview builds for other branches** are optional (Worker → **Settings** → **Builds**). Each preview gets its own URL, which is a separate origin, so it has separate storage. `wrangler.jsonc` sets `preview_urls: true` on purpose: with a custom-domain route, Wrangler turns the workers.dev subdomain off by default, and a deploy from `main` without that line switched preview URLs off for every branch. Google sign-in works on a preview only if its origin (e.g. `https://<branch>-bump-tracker.picme-nz.workers.dev`) is added to the OAuth client.
- **Cloudflare behaviours the app relies on:**
  - Cloudflare answers `/index.html` with a 307 to `/`. `sw.js` serves that redirected cached copy as a clean response (#3).
  - Cloudflare returns 404 for `/_headers`, so it is never precached (#4).

## Security: dedicated origin and headers (review item M3)

1. **Dedicated origin: done.** `bump-tracker.aiagents.nz` is its own origin: other `*.aiagents.nz` sites can't read its storage or service worker. The app sets no cookies, so parent-domain cookies don't matter. Do **not** move the app to a shared origin such as `doneelm.github.io/bump-tracker/`. localStorage, IndexedDB and service worker scope are per-origin, not per-path. Every other page on a shared origin could read the health data and photos, or register an overlapping service worker.
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
- **Update banner:** after a deploy, the new worker takes over at once, but the open page keeps running the old code. When that happens, the app shows "A new version of Bump Tracker is ready" with **Reload**. It doesn't show on a first install. An app left open also checks for a new version when it's shown again, at most every 30 minutes.
- A tab left open across a deploy can lose its old lazy chunks (e.g. the chart) when the new worker activates and deletes the old cache. Offline, that tab shows the recovery screen, and **Reload** fixes it because the new shell is cached. This is accepted.
- End-to-end offline check (Playwright is deliberately not a devDependency, to keep installs small; install it ad hoc, and don't wire this into CI as is): `npm run build && npm i --no-save playwright && npx playwright install chromium && npm run check:offline`.

## Google Drive sync (optional)

Users can sync their data between devices through the hidden app folder (`appDataFolder`) in **their own** Google Drive. We run no server and store nothing.

**How it works:**

- **Encryption:** the data is encrypted on the device first (`src/lib/crypto.ts`). Google only ever holds ciphertext and a data key wrapped by the user's recovery code.
- **Merging:** `src/lib/sync/engine.ts` does a three-way merge per storage key. If both devices changed the same thing, it asks the user which to keep.
- **Photos** are not synced.
- **Sign-in** uses Google Identity Services, loaded only when a sync screen opens (the Sync page or the restore screen), never on Home or the welcome screen. It's loaded and prepared as the screen opens, so tapping **Sign in with Google** opens the popup within the tap; Safari blocks popups opened after a delay. The access token stays in memory, never in storage.
- **Where users find it:**
  - Welcome screen: "Already using Bump Tracker?", then **Restore from Google Drive**, above the due-date form.
  - Home: a "Use Bump Tracker on more than one device?" card while sync is off. **Not now** hides it on that device.
  - **More → Sync**.
- **Headers:** the CSP allows `accounts.google.com/gsi/*` and `www.googleapis.com`, and COOP is `same-origin-allow-popups` so the sign-in popup can report back. Both live in `public/_headers` and the meta CSP in `vite.config.ts`.

**One-time Google Cloud setup:**

1. Create a Google Cloud project and enable the **Google Drive API**.
2. Configure the **OAuth consent screen** (Google Auth Platform → Branding, Audience, Data Access):
   - User type: External. App name: Bump Tracker.
   - Homepage `https://bump-tracker.aiagents.nz`; privacy policy `https://bump-tracker.aiagents.nz/privacy.html`.
   - Google's branding check needs the homepage to link to the privacy policy. A **Privacy policy** link sits at the bottom of the homepage: the welcome screen for new visitors, and Home once set up. Other screens don't carry it. `index.html` also carries a short description and the link inside `#root`, for checkers that don't run JavaScript; the app replaces it on start.
   - Authorized domain: `aiagents.nz`. Verify it once in Google Search Console with a DNS TXT record. That covers the subdomain, and brand verification (app name and logo on the consent screen) needs it.
   - Scope: only `https://www.googleapis.com/auth/drive.appdata`. Google classes it as non-sensitive, so full app verification isn't required.
   - **Publish the app to production.** In testing mode, only listed test users can sign in.
3. Create an **OAuth client ID** of type **Web application**. Authorized JavaScript origins:
   - `https://bump-tracker.aiagents.nz`
   - `http://localhost:4173`, for `npm run preview`
   - `http://localhost:5173` if you want sync in `npm run dev`
4. Put the client ID in `VITE_GOOGLE_CLIENT_ID`. Locally that's `.env.local`, which is ignored by git; copy `.env.example`. On Cloudflare it's the Workers Builds build variable. The ID is public, not a secret.

   The production client ID is:

   ```
   VITE_GOOGLE_CLIENT_ID=626836380740-79lmpemmqhe936isbhd9k2m75bbpjtj1.apps.googleusercontent.com
   ```
5. **Contact email:** `public/privacy.html` lists `dons-bot@agentmail.to` for privacy questions. Use the same address as the support email on the OAuth consent screen, and keep the two in sync.

**Limits to know about:**

- **Recovery code:** every synced device keeps the code next to its data key and shows it again (**Sync → Show recovery code**). That adds no exposure: anyone who can read that storage already has the key and the plain data. Devices set up before this was added ask for the code once to keep it. The synced copy can't be opened only if the code and every synced device are both lost. There's no reset of the encryption itself, by design.
- **Forgot your code? Start over:** on the screen that asks for the code. It deletes the synced copy from Drive (after a confirm), and the user turns sync on again to get a new code. Other devices see the copy was replaced, turn sync off with a message, and rejoin with the new code. Data that differs comes up as a choice, so nothing is overwritten silently. Data on devices is never touched.
- **Simultaneous pushes:** Drive v3 has no conditional write. The app checks the file's `version` right before uploading, and retries after a merge if another device wrote first. If two devices upload within the same moment, the later upload can replace the earlier one, and the earlier device's change from that sync is lost. The device that lost it already counts it as synced, so the next sync won't bring it back. Drive offers no way to prevent this. It needs two devices syncing at the same instant, so it's rare for one person's devices.
- **Size:** the encrypted vault is capped at 1 MiB, details only. Typical data is far smaller. Past the cap, sync pauses with a message and the data stays on the device.
- **Delete all my data** turns sync off on that device before wiping, so it never pushes an empty state. Deleting the Drive copy is a separate button on the Sync page.


## Later: in-app feedback sending

"Contact us" opens an email draft today, so the app stays backend-free. Sending from inside the app would need a Worker endpoint on the same origin:
`main` script with `assets.binding: "ASSETS"` and `run_worker_first: ["/api/*"]`, a `send_email` binding locked to `destination_address: "dons-bot@agentmail.to"`, a `ratelimits` binding, and `env.EMAIL.send({ from, to, subject, text, replyTo })`.
Cloudflare Email Sending needs the Workers paid plan (public beta since April 2026) and `aiagents.nz` onboarded as a sending domain. Only the form's send step in `src/features/feedback/FeedbackPage.tsx` would change; validation and the message body (`src/lib/feedback.ts`) stay.
