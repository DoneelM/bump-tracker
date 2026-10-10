# Bump Tracker

A privacy-first pregnancy tracker demo (Vite + React + TypeScript PWA). All data stays in your browser: no backend, no accounts, no analytics.

> General information only, not medical advice. Contact your midwife/LMC with any concerns, or call 111 in an emergency (NZ).

## Scripts

```sh
npm install
npm run dev       # dev server
npm run build     # type-check + production build to dist/
npm run preview   # serve dist/ (service worker is registered here, not in dev)
npm test          # vitest (runs in Pacific/Auckland time, see vite.config.ts)
```

> Note: with npm 9, adding or upgrading packages can crash with `Cannot read properties of null (reading 'edgesOut')`.
> This is an npm 9 bug, triggered by Vitest 4's optional peer dependencies. Use `npx npm@10 install <pkg>` for that.
> A plain `npm install` from the lockfile works with npm 9.

## Structure

```
src/
  app/          App shell, hash router (router.tsx), route table (routes.tsx)
  components/   Shared UI: Page, HealthDisclaimer, PlaceholderPage, BottomNav, FormField, HubList, ProgressBar, Icon
  features/     One folder per screen (home, onboarding, settings, weeks, tools, weight, contractions,
                scans, kicks, photos, checklists, journal, more, partner, print, data, sources, about)
  lib/          Pure logic + hooks
    dates.ts        LocalDate (YYYY-MM-DD) arithmetic, timezone/DST-safe
    pregnancy.ts    Due date (LMP / scan), gestational age, trimester, countdown, validation
    profile.ts      Onboarding profile type + validator
    storage.ts      Versioned localStorage (keys `bt:v1:<name>`), validated reads
    useStoredState  React hook over storage (syncs across components and tabs)
    photoStore.ts   IndexedDB photo blobs (raw API)
    route.ts        Path normalising/matching for the router
  data/         Content: weeks.ts (WeekInfo), sources.ts. Placeholders, fill in from sourced material
  styles/       tokens.css (CSS variables), base, layout, components
public/
  manifest.webmanifest, sw.js (cache-first shell, versioned cache), icons/*.svg
```

### Adding a feature screen
1. Build it in `src/features/<feature>/`.
2. Register its route in `src/app/routes.tsx` (and add a hub link in Tools/More if needed).
3. Persist data with `useStoredState(name, default, validator)`, and add the key to `STORAGE_KEYS`.

### Security notes
- No `dangerouslySetInnerHTML`. All stored and imported data passes through validators in `src/lib`.
- The production build injects a strict Content-Security-Policy meta tag (`vite.config.ts`). React `style={...}` props are fine because they set styles through the CSSOM. If a library injects `<style>` tags, it will need a `style-src` change.
