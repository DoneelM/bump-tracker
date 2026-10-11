---
target: Home
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/dmaran/GIT/bump-tracker/src/features/home/HomePage.tsx"
target_fingerprint: "sha256:5b7e3100f283d9f47950a3212acefa09f555e74e683e8de27cd4fe2ac0910da1"
target_path: /Users/dmaran/GIT/bump-tracker/src/features/home/HomePage.tsx
timestamp: 2026-10-11T09-44-08Z
slug: src-features-home-homepage-tsx
---
# Critique: Home (src/features/home/HomePage.tsx)

Method: dual-agent (A: design review · B: detector + browser)

## Heuristics: 24/40 (Acceptable)
1 Status 2: progress tick labels evenly spaced (0/14/28/40) so 24w fill sits under "28".
2 Real world 3: good NZ terms; "LMC" unexplained, "Countdown to Baby" reads as placeholder.
3 Control 3. 4 Consistency 2: HelpRow vs CallCard differ (labels, Healthline missing); terracotta used 4x in first viewport.
5 Error prevention 2: no tel: link on Home when no care team saved; "111" is plain text.
6 Recognition 3. 7 Efficiency 2: contraction timer last at every gestation.
8 Minimalist 2: same fact shown four ways in first viewport; empty tiles take full rows.
9 Recovery 2: empty tiles are status, not prompts. 10 Help 3.

## Specificity
Category-template Home (hero GA, bar, countdown, fruit size, tiles, quick actions). NZ-ness in copy and Coming up card; privacy invisible on Home; no stage adaptation. Detector: 0 anti-patterns in markup or live DOM on Home, contractions, warning signs. 20 DESIGN.md drift advisories (14 font-size, 5 colour, 1 font); real ones: 0.75rem text in .hero__scale, .tabbar__link, .tag; .big-button 1.75rem and .timer-readout 1.5rem off ramp. Rest: emoji sizes, print #000, slideshow scrim, mono stack.

## Priority issues
- [P0] Safety route below the fold and not tappable without saved LMC. HelpRow top ~1235px vs tab bar 747px at 375x812. Fix: move under hero; always show Healthline + 111 call buttons; LMC first when saved. (layout, harden)
- [P1] Progress scale misleading. Fix: position ticks at week/40 or mark trimesters on the bar. (polish)
- [P1] Redundant top: hero + countdown = ~75% of first viewport for one fact. Fix: merge into one hero; move "Change dates" to Settings. (distill)
- [P2] Stage-blind Home: timer last at 39w; kick counter appears at 28w unannounced. Fix: order sections by gestation band. (shape/layout)
- [P2] Empty tiles dead weight; minmax(11rem) won't fit two-up at 375; "scans log" mislabels appointments. Fix: hide or merge empties into one action row. (distill, clarify)

## Persona red flags
- Anxious at 2am, 24w, no number saved: celebratory countdown first; 1.5 screens to "Worried?"; no call button; Healthline absent; movement guidance exists in data but not on Home. Worst path.
- Casey: two flicks to help; timer at bottom.
- Sam: help row has no heading; week-card link name front-loads fruit caption; 12px scale text; "111" not a link.
- Jordan: LMC not expanded; nothing says data stays on this phone.

## Minor
- "Home" h1 duplicates tab and brand (~56px).
- Progress valueText ignores days.
- Unverified: Weeks tab and app shell never check profile.ending (grep), so week guides may still show after a loss.

## Questions
- Which card goes so help fits above the fold: countdown or fruit?
- Should 38w Home differ from 14w Home?
- What makes Home visibly private at first glance?
