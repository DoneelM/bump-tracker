# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pregnant people in Aotearoa New Zealand, and their partners. Today the main users are the owner's own household, using it for a real pregnancy. It is also public at bump-tracker.aiagents.nz.

They use it on a phone, often one-handed, sometimes tired or stressed: timing contractions, counting movements, checking whether a symptom means calling someone. Partners get a read-only summary or snapshot link, not their own account.

## Product Purpose

Keep track of a pregnancy week by week: due date and progress, a weekly guide, logs (weight, scans, movements, contractions, symptoms, blood pressure, glucose), checklists, questions for the midwife, and the NZ antenatal timeline. When something might be wrong, it points straight to the right person to call.

Success: the household uses it through the whole pregnancy and trusts it with their data. It also stands up as a public example of careful, privacy-first product work.

## Positioning

- **Private by default.** No account, no backend for user data, no tracking, no ads. One anonymous daily count (version and mode only) that users can turn off. Data stays in the browser. Optional sync is end-to-end encrypted to the user's own Google Drive, and the operator stores nothing.
- **Built for the NZ system.** Midwife/LMC, Health NZ antenatal timeline, Healthline, PlunketLine, 111. Not an overseas app with NZ numbers bolted on.
- **Calm, not a content farm.** No feed, no upsell, no daily push articles. A tool you open when you need it.

## Operating Context

- Installable PWA, works offline. Hash routing, static assets on Cloudflare Workers.
- Used alongside real care: appointments with a midwife/LMC, scans, a printed summary brought to appointments (`#/more/print`).
- Light and dark mode, following the device or set per device in Settings.

## Capabilities and Constraints

- Features are listed in `README.md`. Working rules (layout, tokens, data, security, writing style) are in `CLAUDE.md` and are binding.
- General information only, not medical advice, not clinically reviewed. Every medical figure comes from `src/data/sources.ts` / `docs/SOURCES.md`; never change figures or guidance wording from memory.
- The app sets no targets and doesn't interpret readings. It only flags limits the user entered from their own care team, then points to that team.
- The "call your midwife/LMC", Healthline and 111 routes stay visible where they are today (Home, contraction timer, kick counter, warning signs). Design changes must not bury them below the fold.
- Pregnancy can end in loss. "My pregnancy has ended" stops all pregnancy updates and shows support routes; design must never assume a happy outcome.
- No new external origins, no CSS-in-JS (strict CSP), Recharts lazy-loaded.
- Terminology: midwife/LMC, Health NZ, Healthline, PlunketLine.

## Paying for it later

The app may charge for extras one day. These rules hold whatever the model:

- **Safety content stays free, always:** warning signs, first aid, 111, Healthline, PlunketLine, midwife/LMC routes, the immunisation schedule, and the support lines after a loss. Never put them behind a paywall, a sign-in or a "supporter" screen.
- **No ads, no selling or sharing data, no tracking**, now or later. A paid unlock must work without an account (an offline licence key), so paying never means handing over who you are.
- Paid extras are things like themes, more printables and family sharing. Never the basics of tracking a pregnancy or a baby.
- Reused content must allow commercial use first. `docs/DEPLOY-NOTES.md` ("Before charging") lists what to clear.

## Brand Commitments

None fixed. Name, illustrations and visual identity are all open to change.

Voice (from `CLAUDE.md`): plain NZ English, short sentences, no AI prose, no em dashes.

## Evidence on Hand

- Content sources: `src/data/sources.ts`, `docs/SOURCES.md`.
- Screenshots at 390 px with demo data: `docs/screenshots/`.
- Stylised baby illustrations (AI-generated, seven stages): `public/images/baby/`.
- No testimonials, user numbers or clinical endorsement exist. Do not invent any.

## Product Principles

1. **Privacy is the product.** Nothing leaves the device unless the user turns it on, and then only encrypted.
2. **The right call is one tap away.** Safety routes outrank everything else on the screens where they live.
3. **Quiet tool, not a feed.** Show what the user needs this week; no engagement mechanics.
4. **Inform, don't advise.** Sourced general information; the care team interprets.
5. **Never assume the outcome.** Every screen has to hold up for loss as well as birth.

## Accessibility & Inclusion

- WCAG AA contrast (4.5:1) for every text/background pair in both themes, documented in `src/styles/tokens.css`.
- Tap targets at least 48px. Mobile first at 390 px; key actions above the bottom nav.
- Real labels on inputs, visible focus, semantic headings.
