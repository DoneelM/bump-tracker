# Hey Baby: notes for Claude

A privacy-first pregnancy tracker for Aotearoa New Zealand. Vite + React 18 + TypeScript, installable PWA, hash routing, no backend. Data lives in the browser (localStorage + IndexedDB). Optional sync writes an end-to-end encrypted copy to the user's own Google Drive app folder. Deployed as static assets on Cloudflare Workers at `heybaby.nz`.

README.md has the feature list and structure. This file is the working rules.

## Commands

```sh
npm install            # Node 20+. With npm 9, add/upgrade packages via `npx npm@10 install <pkg>` (npm 9 crashes on Vitest 4's peers)
npm run dev            # Vite dev server (no service worker, no CSP)
npm run typecheck      # tsc --noEmit
npm test               # vitest run, in Pacific/Auckland time (set in vite.config.ts)
npm run build          # typecheck + vite build + fills dist/sw.js precache list
npm run preview        # serve dist/; the service worker only registers here
npm run check:offline  # headless offline check of dist/ (needs: npm i --no-save playwright)
```

Before pushing: `npm run typecheck && npm test && npm run build` must all pass. Workers Builds runs `npm test && npm run build` on every push and deploys `main` to production, so a red `main` is a broken deploy. Touching `public/sw.js` or `scripts/sw-precache.mjs` also owes `npm run check:offline`.

## Layout

- `src/app/`: shell, hash router, route table (`routes.tsx`).
- `src/features/<feature>/`: one folder per screen. New screens go here, get a route in `routes.tsx`, and a hub link in Tools or More if needed.
- `src/components/`: shared UI (`Page`, `FormField`, `HubList`, `Icon`, `CallCard`, `HealthDisclaimer`, ...). Reuse these before writing new ones.
- `src/lib/`: pure logic and hooks, each with a colocated `*.test.ts`. Keep logic here, not in components, so it can be tested in node.
- `src/data/`: content (weeks, guidance, helplines, sources, milestones).
- `src/styles/`: `tokens.css` (design tokens, light + dark), `base.css`, `layout.css` (includes print), `components.css`, `features.css`.
- `public/`: `sw.js`, manifest, `_headers`, icons, baby images, privacy page.
- `scripts/`: build helpers and node-side tests (service worker, theme tokens, week lengths).

## UI rules

The app is used on phones, often one-handed and sometimes stressed (contraction timer, warning signs). Design for that first.

- **Mobile first.** Check layouts at 390 px wide. The bottom nav takes the bottom of the screen; key actions must sit above it without scrolling.
- **Tap targets** are at least `var(--tap-target)` (48px).
- **Use the tokens.** Colours, spacing, radii, type sizes and shadows come from `src/styles/tokens.css`. No hard-coded hex values or pixel spacing in components or feature CSS.
- **Contrast is tested, not assumed.** Every text/background pair meets WCAG AA (4.5:1) in both themes, and the ratios are written in the comment at the top of `tokens.css`. If you add or change a colour, check the ratio in both themes and update that comment. `--color-coral-500` is decorative only.
- **Dark mode is written twice** in `tokens.css` (`[data-theme='dark']` and the system media query). Keep the two blocks identical and give every light `--color-*` token a dark value; `scripts/theme-tokens.test.mjs` fails otherwise.
- **Styling is plain CSS with class names.** Avoid inline `style={{}}` beyond dynamic values. No CSS-in-JS library: anything that injects `<style>` tags breaks the production CSP (`vite.config.ts`).
- **Charts (Recharts) are lazy-loaded** with `React.lazy`, and must follow the theme. Don't import Recharts into an eagerly loaded module; it pushes the main chunk past 500 kB.
- **Print** has its own stylesheet section in `layout.css`; check `#/more/print` after layout changes.
- **Accessibility:** real labels on inputs (use `FormField`), visible focus (`--color-focus`), semantic headings, no focus ring drawn around page headings.

## Health content rules

This is general information, not medical advice, and it hasn't been clinically reviewed.

- Never change medical figures, thresholds or guidance wording from memory. Every figure comes from a source in `src/data/sources.ts` and `docs/SOURCES.md`; `scripts/week-lengths.test.mjs` checks week lengths and weights.
- The app sets no targets and doesn't interpret readings (blood pressure, glucose). It flags only limits the user entered from their own care team, then points them to that team.
- Keep the "call your midwife/LMC", Healthline and 111 routes visible where they are today (Home, contraction timer, kick counter, warning signs). A UI change must not bury them below the fold.
- NZ terms: midwife/LMC, Health NZ, Healthline, PlunketLine.

## Data and security rules

- Persist with `useStoredState(name, default, validator)` and register the key in the storage registry (`STORAGE_KEYS`, keys look like `bt:v1:<name>`). Every stored or imported value goes through a validator in `src/lib`.
- No `dangerouslySetInnerHTML`.
- No analytics, trackers or third-party requests. The only external origins are Google Identity Services and the Drive API, loaded only when the user turns on sync. A new origin means a CSP change in `vite.config.ts` and a reason.
- Dates use `LocalDate` (`YYYY-MM-DD`) from `src/lib/dates.ts`, never raw `Date` arithmetic, because of DST.

## Writing style (UI copy, docs, commits, PRs)

Plain NZ English, short sentences, no AI prose. Do not use em dashes or the `--` substitute, and avoid: seamless, robust, leverage, elevate, empower, delve, pivotal, cutting-edge, game-changing, "in today's", "let's dive in", "in summary", "moreover", "furthermore". Say what the thing does.
