# Claude Code run log

This app was built by driving Claude Code (CLI v2.1.296) headless, with a reviewer agent planning each run, checking the output in a headless browser between runs, and doing small fixes.

**Invocation** (run from the repo dir, prompt passed on stdin, 45 min timeout per run):

```sh
claude -p --model <opus|sonnet> --output-format json --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Write,Glob,Grep,Bash(npm *),Bash(npx *),Bash(node *),Bash(git status*),Bash(git diff*),Bash(git add *),Bash(git commit *)" \
  --disallowedTools "WebFetch,WebSearch" [--add-dir /workspace/research]
```

- No `bypassPermissions` / `--dangerously-skip-permissions`. No web tools. Claude Code could not push or open the PR (the reviewer did that).
- Opus did the architecture/scaffold run; Sonnet did the feature runs. Each run was a fresh session because the opus scaffold session was large. No `--resume` was needed, because every run finished cleanly.
- Medical figures were **not** left to Claude Code. The reviewer gathered them with web research and passed them in as a read-only research folder (`--add-dir`), with instructions to copy them exactly:
  - NHS week-by-week pages for lengths, size objects and weekly text.
  - WHO fetal growth chart Table 11 for EFW percentiles.
  - IOM 2009 Table S-1 for weight gain ranges.
- The reviewer checked all 37 weeks' lengths and weights against the source data with a script. There were zero mismatches.

## Runs

| # | Model (alias → resolved) | Scope | Turns | Duration | Est. cost (USD) | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `opus` (claude-opus-5-5) | Architecture + scaffold: app shell, hash router, storage layer, date logic + tests, onboarding, home | 105 | 11.6 min | $3.26 | success; build + tests passed |
| 2 | `sonnet` (claude-sonnet-5-5) | Week-by-week guide (4-40), size comparison, baby illustrations, sources | 44 | 3.6 min | $1.07 | success; build + tests passed |
| 3 | `sonnet` (claude-sonnet-5-5) | Weight tracker (IOM band) + scans log (WHO EFW chart) | 44 | 3.5 min | $0.86 | success; build + tests passed |
| 4 | `sonnet` (claude-sonnet-5-5) | Contraction timer (5-1-1, wake lock) + kick counter | 21 | 2.5 min | $0.57 | success; build + tests passed |
| 5 | `sonnet` (claude-sonnet-5-5) | Bump photo timeline, journal, checklists | 34 | 4.4 min | $0.82 | success; build + tests passed |
| 6 | `sonnet` (claude-sonnet-5-5) | Partner summary/link, print summary, backup/import/delete, home dashboard | 49 | 4.3 min | $1.12 | success; build + tests passed |
| 7 | `sonnet` (claude-sonnet-5-5) | Polish pass from my browser review (8 fixes) | 72 | 2.2 min | $0.67 | success; build + tests passed |
| **Total** | | | **369** | **32.0 min** | **≈ $8.36** | |

The cost is the CLI's `total_cost_usd` estimate. The runs used a Claude Team seat, so this is an API-equivalent figure, not an invoice.

## Problems found in review and how they were fixed

- **Runner bug (mine).** `--allowedTools` and `--disallowedTools` take variadic arguments, so they swallowed the positional prompt. The prompt is now passed on stdin.
- **Run 2 source list.** The three Mayo Clinic page titles were attached to the wrong URLs. The usage notes also claimed "cross-checking" that hadn't been done. The reviewer fixed both in `src/data/sources.ts` and `docs/SOURCES.md`, and credited NHS as the source of the lengths.
- **Run 2 emoji fallbacks.** Some size-comparison emoji showed a different object, for example pomegranate shown as an apple. Run 7 changed them to a neutral 🌱 and relies on the caption.
- **Runs 3-5 UX, found in screenshots:**
  - Every page drew a large focus rectangle around its heading.
  - Long add-forms pushed charts and lists below the fold.
  - The checklist was a wall of always-editable inputs.
  - The photo week select was truncated.
  - Run 7 fixed all of these.
- **Run 4 logic.** The 5-1-1 alert could stay on screen long after a session ended. Run 7 added a staleness check with a test.
- **Run 3 bundle.** Recharts pushed the main chunk past 500 kB. Run 7 lazy-loads the charts, which brought the main chunk to 275 kB.
- **Run 7 icon path.** It used an absolute `/icons/apple-touch-icon.png` path. The reviewer made it relative to match the manifest.
- **Icons.** The reviewer rendered PNG icons (192/512/maskable/apple-touch) from the SVG with headless Chromium, so no new dependency was needed.
- **Illustrations.** The reviewer generated them, not Claude Code. The free image-generation quota ran out after 7 usable images.

## Review round 1 (code review, security review)

Same flags as above. The Ponytail (minimal-code) plugin now loads automatically. The review files were passed read-only with `--add-dir`. No run reported a usage, session or weekly limit, and none mentioned extra usage or credits.

| # | Model (alias → resolved) | Scope | Turns | Duration | Est. cost (USD) | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | `sonnet` (claude-sonnet-5-5) | Future scan dates, M1 date/timestamp bounds + error boundary, M2 imported photos via preparePhoto + magic bytes, L2 pixel cap, L3 caps, atomic `applyBackup` + single-transaction photo replace, one storage registry, `storage.persist()` | 92 | 5.3 min | $1.47 | success; typecheck, tests (256) and build passed |
| 9 | `sonnet` (claude-sonnet-5-5) | Pre-pregnancy re-entry, wake lock/timer only while timing, same-day chart points, "before pregnancy" age, 5-1-1 wording, schema comment, Ponytail cuts #15/#17/#18/#20, header-based pixel check before decode | 71 | 2.2 min | $0.61 | success; typecheck, tests (262) and build passed |
| **Round total** | | | **163** | **7.5 min** | **≈ $2.08** | |

**Running total: 9 runs, 532 turns, ≈ 39.5 min, ≈ $10.44.**

The reviewer did the service worker fix by hand, in a separate worktree, cherry-picked as `df703fd`:

- `scripts/sw-precache.mjs` runs as part of `npm run build`. It writes every built file and a content hash into `dist/sw.js`.
- The worker installs all of its files before it activates, and serves navigations from its own versioned cache.
- Tests:
  - `scripts/sw.test.mjs` runs `sw.js` against in-memory Cache Storage and covers offline after one visit, offline after a redeploy, and a failed install.
  - `npm run check:offline` is a headless Chromium end-to-end check of scenarios A and B. Against the old `sw.js` it fails with "blank screen offline after first visit"; against the new one it passes.

Checked in review:

- Run 8's `applyBackup` rollback and error boundary were read through.
- In a headless browser:
  - A future appointment saves and shows on Home.
  - Measurements on a future date are rejected.
  - The pre-pregnancy form comes back after Remove.
  - A crafted backup is handled: the 2200 LMP profile, 1e300 timestamps and an SVG posing as a PNG are all skipped, and the app still renders.
  - An aborted chart chunk shows the error boundary with Download a backup and Delete all my data.

## Review round 2 (Wolverine recheck of 889613a + Iron Man re-review)

| # | Model (alias → resolved) | Scope | Turns | Duration | Est. cost (USD) | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | `sonnet` (claude-sonnet-5-5) | N1 honest rollback + safety backup, N2 `planPhotoRestore` (all-fail keeps device photos, confirm on partial), all-invalid key keeps existing data, `apply()` try/finally, recovery backup says "no photos", live contraction clock/wake lock (`isSessionLive`), L2 whole-file fail-closed size check (post-decode check removed) | 46 | 2.6 min | $0.64 | success; typecheck, tests (273) and build passed |

**Running total: 10 runs, 578 turns, ≈ 42.1 min, ≈ $11.08.** No usage or rate limit messages were seen.

The reviewer made these changes by hand, in a separate worktree, cherry-picked as `e86271c`:

- N3: the `check:offline` server now binds to 127.0.0.1, and every path is resolved and must stay inside the served root. `%2e%2e%2f` and `..%2f` are blocked.
- The `public/sw.js` header comment now points to `scripts/sw-precache.mjs`.
- DEPLOY-NOTES now say that Playwright is installed ad hoc rather than as a devDependency. They also note that a tab left open across a deploy can lose its old lazy chunks.

Checked in review:

- The diff was read through.
- In a headless browser, the contraction clock ticks between contractions (01:00 → 01:03 after 3 s), and it stays still when the last contraction ended 14 minutes ago.
- `npm run check:offline` passed.

## Follow-ups after approval (by hand, no Claude Code run)

These came from Iron Man's re-review 2 and Wolverine's recheck at `bfd546f`:

- After 7 minutes, the "since last" line now reads "over 7 min" instead of freezing at 07:01.
- The "1 photo … was skipped" plural is fixed.
- The file input is cleared after every pick, so choosing the same file again works.
- N4: weeks whose backup photo fails the signature check keep their device photo.
- An all-invalid nested contraction log no longer wipes the existing log.
- The safety backup file is named `bump-tracker-safety-backup-<date>.json`.
- The photo file cap is now 30 MB.

Checked in a headless browser: the contraction line reads "over 7 min" 14 minutes after the last contraction ended, and `check:offline` passes.

## QA round 1 (Vision QA of main @ a929ea6, branch fix/qa-round1)

| # | Model (alias → resolved) | Scope | Turns | Duration | Est. cost (USD) | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 11 | `sonnet` (claude-sonnet-5-5) | M1 contraction guidance (always-on "when to contact" panel, immediate under-37-weeks card, non-diagnostic 5-1-1 copy), S1 timer first, S3 next appointment, S4 past-due prompt, S5 checklist labels and 44px rows, S6 pre-eclampsia note, S7 kick-session guidance, S8 persistence helper, N1/N3/N4/N5/N6/N7/N9 | 73 | 3.6 min | $0.98 | success; typecheck, tests (291) and build passed |

**Running total: 11 runs, 651 turns, ≈ 45.7 min, ≈ $12.06.** No usage or rate limit messages were seen.

The reviewer made these changes by hand:

- S2: `public/sw.js` now matches the cache with `ignoreVary: true`. The `check:offline` server now sends `Vary: Origin`, as `vite preview` does. With that header the old worker fails the check ("B: blank screen offline after redeploy") and the new one passes.
- S1: a one-line "Contact your midwife/LMC now. Details below." strip now sits right under Start/Stop whenever the 5-1-1 or under-37-weeks card is showing. Without it, the timer-first layout pushed the guidance below the fold.

Checked in a headless browser at iPhone 14 size (390×664 viewport), with 13 contractions 5 minutes apart at 31 weeks:

- Start/Stop sits at y 208–496 and the strip ends at y 578, both above the tab bar at y 599.
- The 5-1-1 and under-37-weeks alerts both show.
- The under-37-weeks card appears as soon as the first contraction starts.
- Tapping a checklist item's text toggles it, and rows are 44px tall.
- `check:offline` passed.

The health guidance wording sources are in `docs/SOURCES.md`, and the wording still needs clinical sign-off.
