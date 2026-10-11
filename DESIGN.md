---
name: Bump Tracker
description: A private, NZ-specific pregnancy tracker that lives on your phone.
colors:
  cream: "#fff8f0"
  surface: "#ffffff"
  peach-100: "#ffeee4"
  peach-200: "#ffd9c4"
  peach-300: "#f9b99b"
  coral-500: "#e8785a"
  terracotta: "#b04a32"
  terracotta-deep: "#943b27"
  kawakawa-100: "#e5efe0"
  kawakawa-300: "#b7cfae"
  kawakawa-700: "#3d5a40"
  text: "#3b2a26"
  text-muted: "#6b5550"
  border: "#f0dccf"
  error: "#a12a2a"
  error-bg: "#fdecea"
  warning-bg: "#fff3d6"
  focus: "#2f5ea8"
  on-primary: "#ffffff"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.05em"
rounded:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.5rem"
  "6": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.5rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.terracotta}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.5rem"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.peach-100}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.5rem"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  card-soft:
    backgroundColor: "{colors.peach-100}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "48px"
  hub-item:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
    height: "72px"
  tag:
    backgroundColor: "{colors.peach-100}"
    textColor: "{colors.terracotta}"
    rounded: "{rounded.pill}"
    padding: "0.1rem 0.5rem"
  big-button:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.on-primary}"
    rounded: "50%"
    size: "min(18rem, 80vw)"
---

# Design System: Bump Tracker

## Overview

**Creative North Star: "The Kitchen Table"**

Bump Tracker should feel like the notebook kept on the kitchen table next to the fruit bowl: warm, domestic, always to hand, never a clinic form. The room is cream and peach, the ink is a warm brown, and the one strong colour is terracotta, saved for the thing you should press. A second voice, kawakawa green, marks calm facts: the trimester, a timeline date, a disclaimer, an "all good" state.

The mood is gentle, tactile and hopeful. Surfaces are soft, rounded cards with a faint warm shadow, so they read as objects you can pick up. Emoji and the stylised baby illustrations add a light, human touch. Underneath the softness the system is strict: every colour pair is tested for WCAG AA in both themes, every tap target is at least 48px, and type is the device's own system font so nothing loads and nothing looks foreign on the phone.

Density is low. One column, a 40rem content width, generous card padding, and one idea per card. The phone is the primary canvas; wide screens get the same column with the tab bar moved to the top.

**Key Characteristics:**
- Cream ground, white or peach cards, warm brown text.
- Terracotta for primary actions and key numbers only; kawakawa for calm status.
- Rounded everything: 24px cards, pill buttons, a circular timer button.
- System font, bold weights for hierarchy, tabular numbers for timers.
- Light and dark themes are written twice and kept identical in structure.

## Colors

A warm, low-contrast room with one assertive accent and one calm one.

### Primary
- **Terracotta** (`terracotta`): primary buttons, links, the current week, the countdown number, the active tab, chart lines for "your" data. Darkened from the decorative coral so white text clears 5.4:1. In dark mode it lightens to a soft salmon and takes dark text.
- **Terracotta Deep** (`terracotta-deep`): hover and pressed state of primary buttons only.
- **Coral Glow** (`coral-500`): decorative only. The start of the progress bar gradient. Never text, never a sole signal.

### Secondary
- **Kawakawa Leaf** (`kawakawa-700`): calm status text. Trimester eyebrow, timeline dates, disclaimer text, success cards, the running state of the timer button, chart median lines.
- **Kawakawa Wash** (`kawakawa-100`): background for disclaimers, success cards and the update banner.
- **Kawakawa Mid** (`kawakawa-300`): success borders and the chart reference band.

### Neutral
- **Cream** (`cream`): the page ground.
- **Surface** (`surface`): cards, inputs, the tab bar.
- **Peach Blush** (`peach-100`): soft cards, hover fill, selected choices, icon wells, tags.
- **Peach Bloom** (`peach-200`): progress track.
- **Peach Edge** (`peach-300`): input and ghost button borders.
- **Warm Ink** (`text`): body text, 12.9:1 on cream.
- **Warm Ink Muted** (`text-muted`): secondary text, 6.6:1 on cream.
- **Card Edge** (`border`): 1px card borders and dividers.
- **Alert** (`error`, `error-bg`): errors, the 111 and delete buttons, readings above a user-entered limit.
- **Honey Wash** (`warning-bg`): the 5-1-1 alert banner and warning cards.
- **Focus Blue** (`focus`): focus rings only. Deliberately outside the palette so it is never mistaken for content.

### Named Rules
**The One Terracotta Rule.** Terracotta means "press this" or "this is the number that matters". If two things on a card are terracotta, one of them is wrong.

**The Tested Pair Rule.** No colour pair ships without its contrast ratio, in both themes, written in the comment at the top of `tokens.css`.

**The Decorative Coral Rule.** Coral Glow never carries meaning on its own and never sets text.

## Typography

**Display Font:** System UI stack (`system-ui`, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial)
**Body Font:** Same stack.
**Label/Mono Font:** `ui-monospace` stack, only for the sync recovery code.

**Character:** One family, the phone's own. Hierarchy comes from weight (400 to 800) and size, not from a second typeface, so the app feels native and loads nothing.

### Hierarchy
- **Display** (800, 2.5rem, 1.0): single key numbers. The countdown days, timer readouts at large size.
- **Headline** (700, 2rem, 1.25): page titles and the gestational age on Home.
- **Title** (700, 1.125rem to 1.5rem, 1.25): card headings (`h2`), hub item titles, week card titles.
- **Body** (400, 1rem, 1.5): everything else. Line length is held by the 40rem column.
- **Label** (700, 0.875rem): tile labels, the trimester name, tab bar labels and tags. 0.875rem is the floor; no screen text goes smaller.
- **Glyphs** (1.5rem to 4rem): emoji and icon glyphs (page icons, hub icons, size comparisons) sit outside the text ramp. The timer button (1.75rem) and readout (1.5rem) are the only display text between steps.

### Named Rules
**The Weight Not Face Rule.** Hierarchy comes from weight and size. Do not add a second typeface or a web font.

**The No Eyebrow Rule.** Headings carry their own weight. Don't put an uppercase kicker above them; put the fact in the line below instead.

**The Steady Numbers Rule.** Anything that ticks (timers, counts) uses `font-variant-numeric: tabular-nums` so digits don't jump.

## Layout

A single centred column, max 40rem wide, with 1rem side padding. Pages are a vertical flex stack with a 1rem gap; cards carry their own 1.5rem padding.

On phones the five-item tab bar (Home, Weeks, Tools, Journal, More) is fixed to the bottom at 64px plus the safe-area inset, and the main area pads its bottom to clear it. From 768px the tab bar becomes a sticky top bar under the header, with icon and label side by side.

Spacing uses a six-step scale (`spacing.1` to `spacing.6`, 4px to 32px). Hub lists and entry lists use a 0.75rem gap. The definition list (`.details`) collapses to one column below 400px.

**The Thumb Zone Rule.** On a 390px screen, the key action for a screen (start timer, call, save) sits above the bottom tab bar without scrolling.

**The Call Route Rule.** The call card or help row stays where it is on Home, the contraction timer, the kick counter and the warning signs page. Layout changes must not push it below the fold.

## Elevation & Depth

Mostly flat, with one soft warm shadow that makes cards feel like paper on a table. Depth comes from the cream ground against white or peach cards, plus a 1px warm border. In dark mode the shadow turns into a plain dark drop, and the tonal step between background and surface does most of the work.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 2px 10px rgb(176 74 50 / 0.08)`): every card, hub item and the big timer button.
- **Card lift** (`box-shadow: 0 4px 16px rgb(176 74 50 / 0.14)`): hover on link cards, with a 1px upward move.
- **Tab bar** (`box-shadow: 0 -2px 12px rgb(59 42 38 / 0.06)`): the fixed bottom bar only.

### Named Rules
**The Paper Rule.** One resting shadow for all cards. Lift happens only on hover of something you can tap.

## Shapes

Soft and round throughout. Cards and hub items use the large radius (24px), inputs and icon wells the medium radius (16px), small inline errors and the skip link the small radius (8px). Buttons, tags and the progress bar are full pills. The contraction and kick timer button is a full circle, the one big shape in the app.

Borders are thin (1px on cards) except where they signal input or state: 2px on inputs, choices and ghost buttons, 3px terracotta on the 5-1-1 alert banner.

## Components

### Buttons
Pill-shaped, bold, never smaller than a thumb.
- **Shape:** full pill (`rounded.pill`), min height 48px, 2px border slot.
- **Primary:** terracotta fill, white text (dark text in dark mode).
- **Hover / Focus:** fill darkens to Terracotta Deep; focus is the global 3px Focus Blue ring with 2px offset.
- **Ghost:** transparent with a Peach Edge border and terracotta text; Peach Blush fill on hover. Used for secondary actions and helpline links.
- **Danger:** Alert fill with white text. Used for "Call 111" and destructive data actions only.

### The Big Button
The contraction timer and kick counter's circular button: up to 18rem across (80vw on small phones), terracotta at rest, Kawakawa Leaf while running, 1.75rem/800 label, resting card shadow. It is the one place the system gets large.

### Cards / Containers
- **Corner Style:** 24px (`rounded.lg`).
- **Background:** Surface by default; Peach Blush for soft cards; Kawakawa Wash for success; Honey Wash for warnings; Alert wash with a 2px Alert border for danger zones.
- **Shadow Strategy:** Card rest; Card lift on hover for link cards.
- **Border:** 1px Card Edge.
- **Internal Padding:** 1.5rem.
- **Stage card (Home):** a 160deg gradient from Peach Blush to Surface. The gestational age is the headline; below it, the trimester in bold Kawakawa Leaf and the countdown on one line. A pill progress bar with week labels (0, 14, 28, 40) placed at their true positions, then the due date in muted text. One card, one fact.

### Inputs / Fields
- **Style:** 2px Peach Edge border, Surface fill, 16px radius, 48px min height. Labels are bold and sit above; hints are muted small text.
- **Focus:** border turns Focus Blue, plus the global ring.
- **Error:** border turns Alert; the message sits in a small Alert-wash block below.
- **Choices:** radio and checkbox options are full-width 2px-bordered rows; selected rows get a terracotta border and Peach Blush fill.

### Navigation
- **Tab bar:** five equal columns, outline icons (1.8 stroke, round caps) over 0.75rem/600 labels in muted text. The active tab turns terracotta and its icon sits in a Peach Blush pill. Bottom-fixed on phones, sticky top bar from 768px.
- **Hub lists (Tools, More):** 72px rows with a 48px Peach Blush icon well, bold title, muted description and a chevron.

### Help Card (Home)
"Worried?" as a real heading, one line of guidance, then call buttons: the saved midwife first (primary), Healthline (ghost), 111 (danger). Quieter text links below: "Add your midwife's number" when none is saved, and "When to call". Before 36 weeks it sits right under the stage card; from 36 weeks it moves to the top of Home and the contraction timer becomes the primary quick action.

### Call Card
The safety component. A card titled "Need help?" listing the user's own care team first (primary buttons), then Healthline (ghost) and 111 (danger). With no care team saved it links to Settings. A compact Help Row version sits on Home.

## Do's and Don'ts

### Do:
- **Do** take every colour, space, radius and size from `tokens.css`.
- **Do** check new colour pairs for 4.5:1 in both themes and record the ratio in the `tokens.css` header.
- **Do** give every light `--color-*` token a dark value, in both dark blocks.
- **Do** keep tap targets at 48px minimum (`--tap-target`).
- **Do** use terracotta for the single primary action or key number on a card.
- **Do** use kawakawa for calm, factual status.
- **Do** keep charts on theme colours: terracotta for the user's data, kawakawa for reference lines and bands, Alert for user-entered limits.

### Don't:
- **Don't** set text in Coral Glow.
- **Don't** add web fonts or a second typeface.
- **Don't** hard-code hex values or pixel spacing in component or feature CSS.
- **Don't** use CSS-in-JS or anything that injects `<style>` tags (it breaks the CSP).
- **Don't** add shadows beyond the three in the vocabulary.
- **Don't** move or hide the call routes on Home, the timers or the warning signs page.
- **Don't** draw a focus ring around page headings.
