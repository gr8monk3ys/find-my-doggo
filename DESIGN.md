---
name: Find My Doggo
description: A lost-dog noticeboard — warm paper, Terracotta ink, and a square photo plate for every listing.
colors:
  terracotta-ink: "#a34929"
  terracotta-ink-dark: "#eaa486"
  terracotta-soft: "#a15d45"
  paper: "#f9f8f5"
  paper-card: "#fbfaf9"
  paper-tinted: "#eeece7"
  paper-warm: "#f5ebe0"
  ink: "#1a1f23"
  ink-muted: "#606976"
  hairline: "#e2dbd5"
  night: "#111317"
  night-card: "#16181d"
  night-tinted: "#25272d"
  night-ink: "#fafafa"
  night-ink-muted: "#abb0ba"
  night-hairline: "#292c32"
  signal-error: "#a71b1b"
  signal-success: "#107535"
  signal-warning: "#935f06"
  signal-info: "#0950c3"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(2.4rem, 5.2vw, 4.9rem)"
    fontWeight: 720
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.9rem, 3.6vw, 3.2rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.55rem, 2.4vw, 2.25rem)"
    fontWeight: 650
    lineHeight: 1.18
    letterSpacing: "-0.026em"
  card-title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 620
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.16em"
rounded:
  none: "0px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  card: "18px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
  24: "96px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta-ink}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  badge-outline:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  badge-filled:
    backgroundColor: "{colors.terracotta-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  wall-label:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0"
  plate:
    backgroundColor: "{colors.paper-tinted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
  brand-mark:
    backgroundColor: "{colors.terracotta-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0"
---

# Design System: Find My Doggo

## Overview

**Creative North Star: "The Lost-Dog Noticeboard"**

Find My Doggo is a noticeboard, the kind pinned up outside a village shop: a sheet of paper for every dog, a photograph pasted on square, the name written large, and underneath it the facts in small capitals — breed, where, when, lost or found. Every listing is one of those sheets. The map is the parish map behind the counter with the sightings pinned to it. Nothing on the board is decorated, because the board is for being read in a hurry by someone who is worried.

The notebook is the same stationery as lscaturchio.xyz and InfiniStar, by design: warm off-white paper with a near-invisible grain, structure drawn with hairlines and space rather than boxes, a serif with personality for what the site says, a plain sans for what the reader reads, and a monospace label beside every piece of metadata. What tells the three notebooks apart is the pen. The personal site writes in forest green, InfiniStar in mulberry; Find My Doggo writes in **Terracotta**, the red of clay, collars and the orange the product used to wear, so it reads as the same site in a steadier hand rather than a rebrand.

What this noticeboard keeps that the siblings do not have: the **photo plate** as the recurring unit of the board, the **status label** (lost / found / reunited) as a piece of mono metadata in a signal colour, and the **map**, which the notebook language extends to: muted tiles on paper, pins in the ink, popups as notebook cards.

The system deliberately is not three things. It is not the orange poster it replaced: no orange-to-orange gradient hero, no `shadow-lg` cards that lift on hover, no emoji standing in for a logo or an icon, no coloured pills over the photographs. It is not SaaS landing-page chrome: no three-column feature tiles, no badge decoration. And it is not a theme engine: one kind of paper, read by day or by night.

**Key Characteristics:**

- One paper ground, warm off-white with a fixed 3.5% noise grain; dark mode is a night variant of the same page.
- One ink, Terracotta, spent sparingly: links, hover, selection, the map pins, the single primary button per view.
- Hairline rules and tint shifts structure the page; there are no floating cards and no decorative shadows.
- Three type voices with fixed jobs: Fraunces speaks, Instrument Sans reads, IBM Plex Mono catalogues.
- Squareness marks the work (photo plates, the mark); roundness marks the interface (controls, chips, pins).
- Status is metadata: a mono wall label in the matching signal token, never a coloured pill over the photo.
- Motion is the interface responding to the reader, never the page introducing itself.

## Colors

A warm, low-chroma paper palette with one terracotta ink and a sand-toned hairline; dark mode inverts to a cool night page with the same ink lifted for contrast. Every pair below is measured by `website/tests/unit/design-tokens.test.ts` from the HSL triplets in `website/src/app/globals.css`; the document does not get to be wrong about contrast.

### Primary

- **Terracotta Ink** (`16 60% 40%` #a34929 light / `18 70% 72%` #eaa486 dark; `--primary`, `--ring`): the one pen. Links, the hover colour of any interactive text, the 22% tint behind selected text, the fill of the single primary button, the map pins and cluster badges, the focus outline, "Doggo" in the wordmark, and the border that warms on a hovered surface. Measured **5.58:1 on paper** and **8.99:1 on night**; white on the light ink 5.93:1, night text on the dark ink 8.99:1. It clears 4.5:1 at any size, so there is no separate "small text" token.
- **Terracotta Soft** (`16 40% 45%` #a15d45 light / `16 40% 40%` #8f533d dark; `--secondary`): a lower-chroma terracotta for the rare secondary fill. It exists so a second ink never has to be invented. 45% rather than the 50% first proposed: white on `16 40% 50%` measured 4.20:1, under the floor; on 45% it is 5.01:1 (dark: 5.79:1).

Terracotta was chosen over the `#f97316` orange it replaces because that orange measures 2.84:1 on white and could never carry text; at hue 16 and 40% lightness the ink keeps the warmth people associated with the site and passes everywhere. The ink's lightness was not adjusted: every pair cleared 4.5:1 at the proposed values.

### Neutral

- **Paper** (`38 25% 97%` #f9f8f5; `--background`): the page. Warm off-white, hue 38, with the noise grain laid over it.
- **Paper Card** (`38 25% 98%`; `--card`, `--popover`): a surface one shade lighter than the page, used for buttons, inputs, popups, the theme pill and cards so they sit on the paper rather than above it.
- **Paper Tinted** (`38 18% 92%`; `--muted`): the recessed tone. The plate ground behind a missing photo, disabled controls, the map's ground behind the tiles.
- **Paper Warm** (`32 50% 92%`; `--accent`): a sand highlight for hover fills and the pressed theme button.
- **Ink** (`210 15% 12%`; `--foreground`): body text. A cool near-black with a blue cast that keeps the warm paper from going yellow.
- **Ink Muted** (`215 10% 42%`; `--muted-foreground`): captions, wall labels, descriptions, placeholders. Everything that is metadata rather than the work.
- **Hairline** (`30 18% 86%`; `--border`, `--input`): the rule. A sand tone, never grey, drawn at 1px and often at 40–90% opacity.
- **Night** (`220 15% 8%`), **Night Card** (`220 15% 10%`), **Night Tinted** (`220 10% 16%`), **Night Ink** (`0 0% 98%`), **Night Ink Muted** (`220 10% 70%`), **Night Hairline** (`220 10% 18%`): the dark-mode counterparts, hue 220, cool rather than warm.

### Signal

- **Error** (`0 72% 38%` light / `0 70% 70%` dark; `--destructive`), **Success** (`142 76% 26%` / `142 71% 45%`), **Warning** (`38 92% 30%` / `38 92% 50%`), **Info** (`217 91% 40%` / `217 91% 65%`): status colours, each with a `-muted` 10–15% tinted background. On this board they have fixed meanings: a **lost** dog is Error, a **found** dog is Success, a **reunited** dog is Info; form errors are Error. They never appear as decoration, and they are reached through the tokens (`text-destructive`, `bg-success-muted`), never as `red-500`.

### Named Rules

**The One Pen Rule.** Terracotta is the only chromatic accent on any surface, and it marks action or emphasis, never area. If a screen has terracotta in more than a few places, it has too many. No gradient anywhere, on anything.

**The Sand Hairline Rule.** Dividers are 1px of Hairline, sand-toned, never neutral grey and never thicker. Depth of structure is expressed by more rules and more space, not by darker lines.

**The Tinted Paper Rule.** A "contained" surface is the same paper at a different tint (Paper Card lighter, Paper Tinted darker), bordered by a hairline. It is never a white box on a grey page.

**The Status Label Rule.** Lost, found and reunited are metadata, set as a mono wall label in the matching signal token beside the listing's facts. Never a coloured pill over the photograph, never a background wash behind the card.

## Typography

**Display Font:** Fraunces, variable, optical size auto — self-hosted from `@fontsource-variable/fraunces`, `preload: false`.
**Body Font:** Instrument Sans, variable — self-hosted from `@fontsource-variable/instrument-sans`, preloaded.
**Label/Mono Font:** IBM Plex Mono 400/500/600 — self-hosted from `@fontsource/ibm-plex-mono`, `display: optional` (a swapping mono label flips a metadata row between one line and two; the sibling site measured 0.135 CLS from it).

No font is fetched at build time; `website/src/lib/fonts.ts` loads them with `next/font/local` and `website/tests/unit/fonts.test.ts` fails on any `next/font/google` import under `src/`.

**Character:** A high-contrast, slightly wonky serif doing the talking, a plain humanist sans doing the reading, and a monospace doing the filing. Fraunces at heavy weights and tight tracking gives headings a printed, poster-like presence; Instrument Sans at 1.65 stays out of the way; Plex Mono, small, uppercase and widely tracked, is the wall label beside the work.

### Hierarchy

- **Display** (Fraunces 720, clamp 2.4–4.9rem, 1.02, −0.035em, oldstyle numerals; `text-display`): the home masthead and nothing else.
- **Headline** (Fraunces 700, clamp 1.9–3.2rem, 1.12, −0.03em; `text-page-title`): one per page.
- **Title** (Fraunces 650, clamp 1.55–2.25rem, 1.18, −0.026em; `text-section-title`): section headings.
- **Card Title** (Fraunces 620, 1.25rem, 1.2, −0.02em; `text-card-title`): a dog's name on a plate or in a row, a popup title. A subsection step exists at 1.075rem / 560 (`text-subsection`).
- **Body** (Instrument Sans 400, 1rem, 1.65): reading text. Lead paragraphs use 1.125rem with `text-pretty`.
- **Description** (Instrument Sans 400, 0.875–1rem, Ink Muted): secondary copy under a title.
- **Label** (IBM Plex Mono 500, 0.72rem, 0.16em tracking, uppercase, tabular numerals, Ink Muted; `label-mono`): the wall label. Kickers, dates, counts, the catalogue line under a plate (`breed · status · date`), the status label, footer column heads, the cluster badge. With `normal-case tracking-normal` it becomes the small mono link. `label-link` adds the 24px (44px on touch) tap-target floor.

### Named Rules

**The Wall Label Rule.** Every piece of metadata (a date, a breed, a place, a status) is set as a Label: mono, small, uppercase, tracked, muted. Metadata never borrows the body or heading voice. Every section, row and figure introduces itself with one before its title — the kicker _is_ the house device.

**The Serif Speaks Rule.** Fraunces appears only where the site is speaking: `h1`–`h6`, the type-scale utilities, the wordmark, dogs' names, stat numerals. Never in body copy, UI controls, form fields or labels. `font-display` on a non-heading fails the build unless the element carries `data-voice="display"`.

**The Fluid Heading Rule.** Headings scale with `clamp()`, not breakpoints; weights step down the hierarchy (720 → 700 → 650 → 620 → 560) and tracking loosens as size falls. A `leading-*` class is honoured over a responsive `text-*` size (Tailwind v4 routes line-height through `--tw-leading`), so write the line-height you mean.

## Layout

The page is a single centred column on open paper, with three widths: narrow (42rem) for reading and for forms, medium (56rem) for mixed content, wide (80rem, the existing `max-w-7xl`) for the masthead, plate galleries and the map. Horizontal padding is 16px, rising to 24px and 32px at the sm and lg breakpoints.

Vertical rhythm is generous. Sections breathe at 64px, then 80px at sm and 96px at lg; small sections at 32/48/64px. Rows pad at 16px (24px at sm), cards at 24px (32px at sm). Between sections sits a full-width hairline (`gallery-rule`), never a background change.

Two-column compositions are asymmetric editorial splits, never equal halves: a listing page is `1fr / 360px` with the plate at the right edge, the footer is `1.1fr / 2fr`. Lists are stacked rows separated by hairlines with the label above the title and the description below, not tiled cards. Plates are the exception: galleries of dogs run 1 → 2 → 3 columns with 24px gaps, because the photograph is the work and the grid is how a noticeboard keeps photographs.

The header is sticky, 72px, 90% paper with a 12px blur and a 40% hairline beneath; below md the links collapse into a hairline-topped list under the header. Breakpoints are Tailwind's defaults.

## Elevation & Depth

Flat paper, tint shifts only. Every surface sits on one plane. Hierarchy is drawn with hairlines and with the three paper tints, and a hover is a colour change (border warming to Terracotta at 45%, background tinting to Terracotta at 5–6%), not a lift. The noise grain over the whole page is what stops large flat areas from reading as sterile screen white.

Two exceptions exist and are structural, not decorative: the sticky header carries a wide, soft shadow (`0 8px 30px rgba(0,0,0,0.08)`) so it reads as a separate sheet when content scrolls under it, and the primary button (`cta-primary`) carries a 1px ledge (`0 1px 0` of Terracotta at 25%) beneath its border so the one filled button feels pressed onto the page.

### Named Rules

**The Flat Paper Rule.** No shadow on any content surface, at rest or on hover. A hovered surface changes tint and border colour; it does not rise. Leaflet's popups and controls are brought onto the same rule in `globals.css` (`box-shadow: none`, a hairline instead).

**The Two Sheets Rule.** The only elevated objects are the sticky header and the primary button's 1px ledge. Nothing else may add a shadow without changing this file first.

**The Scrim Rule.** A modal separates with a scrim, not a shadow. `overlay-scrim` — `hsl(var(--scrim) / var(--scrim-alpha))`, ink in both themes, 25% on paper and 55% at night — is the third sanctioned separation mechanism, and the only one available to an overlay. The scrim is ink rather than `--foreground` because `--foreground` inverts at night and would lay a white veil over the dark page.

**The Measure Rule.** Running text caps at 65–75 characters per line, measured in the DOM, not assumed from the unit.

## Shapes

The form language is soft-cornered paper with one square exception. Fields use 8px corners (`rounded-sm`); small buttons 10px (`rounded-md`); buttons and controls 14px (`rounded-lg`); cards, popovers and dialogs 18px (`rounded-xl`) — and the radius scale is clamped there, so `rounded-2xl` and above resolve to 18px. Chips, badges, the theme pill, map pins and cluster badges are fully round.

**Photo plates are square.** A dog's photograph is a 1:1 plate (`plate`) with 0px corners and a 1px hairline on tinted paper, `object-cover`, no hover scale, no gradient scrim, no pill over the image — the work, pasted onto the page. Squareness marks the work; roundness marks the interface. A listing with no photo gets the tinted-paper plate with the dog's initial in Fraunces in Terracotta.

Borders are always 1px Hairline, frequently at reduced opacity. The header's 90% paper with 12px blur is the one glass surface; glass is for chrome that sits over itself, never for content.

## Components

### Buttons

- **Shape:** 14px radius, 40px tall, 16px horizontal padding; small 36px / 10px radius; large 48px / 32px padding. Text is Instrument Sans 500 at 0.875rem. `Button` renders a `<button>`, `ButtonLink` a `next/link`, both from `website/src/components/ui/button.tsx`; `buttonClasses()` gives the class list for anything else.
- **Primary** (`cta-primary`, the `default` variant): Terracotta fill, white text, a 1px border of Terracotta at 42%, the ledge shadow. One per view. Hover brightens 6%; active presses 1px down.
- **Secondary** (`cta-secondary`): Paper Card fill, hairline, Ink text; hover tints the fill to Terracotta at 5% and warms the border to 45% and the text to Terracotta. **Ghost**: transparent until hovered, then Paper Card with a hairline. **Link**: Terracotta text with `ink-underline`. **Destructive**: the secondary shape with Error text.
- **Focus:** the global `:focus-visible` outline — 2px Terracotta at a 2px offset — on everything focusable, pre-coloured so it never interpolates. No `ring-*` stacks on any primitive.
- **Disabled:** Paper Tinted fill, Ink Muted text, hairline, no ledge, 60% opacity.

### Chips / Badges

- **Style:** fully round, 12px horizontal / 4px vertical padding, 0.75rem semibold (`Badge` in `ui/badge.tsx`).
- **Outline** (the house chip): Paper Card fill with a hairline, Ink text.
- **Filled**: Terracotta fill, white text. Reserve for a single count per view.
- **Status is not a chip.** Lost / found / reunited is a `label-mono` in `text-destructive` / `text-success` / `text-info`. **Tag filters are not chips** either: they are wall-label links with `aria-pressed`, separated by gap.

### Cards / Rows

- **Card:** Paper Card on Paper, 1px hairline, 18px radius, 24px padding, no shadow. Interactive cards warm the border on hover.
- **Preferred alternative:** most "cards" are not cards. Text-led lists are stacked rows divided by hairlines: a mono label, a semibold title that turns Terracotta on hover, a two-line clamped description in Ink Muted. Lists cap at 42rem.

### Inputs / Fields

- **Field** (`input-field`; `Field`, `Input`, `Textarea`, `Select` in `ui/field.tsx`): Paper Card fill, hairline, 8px radius, 40px tall, 0.875rem text, placeholder Ink Muted at 80%. The label above it is a wall label. Focus warms the border to Terracotta at 50% plus the global outline. Invalid fields take an Error border and an Error line beneath.

### Navigation

- **Header** (`Navbar.tsx`): sticky, 72px, 90% paper, 12px blur, 40% hairline beneath, the one structural shadow. `<Logo>` at the left; nav links in body sans with `ink-underline` (the underline scored in from the left over 240ms, kept on the link carrying `aria-current="page"`); the theme toggle — a round hairline pill of three icon buttons, light / dark / system, with `aria-pressed` — and the menu button at the right. Below md the links become a hairline-topped list of 44px rows inside the same `<nav>`; the page has exactly one navigation landmark.
- **Footer** (`Footer.tsx`): hairline above at 60%, `1.1fr / 2fr` grid, the lockup and one sentence at the left, column heads in mono, links in sans with `ink-underline`, a hairline before the legal line.

### Photo Plate (signature)

A square-cornered 1:1 plate (`plate`) with a 1px hairline. Below it, outside the image: the name in Fraunces at Card Title, then one mono catalogue line — `breed · status · date` — with tabular numerals, the status in its signal token. Hover: the name turns Terracotta and the plate border warms.

### The Map (signature)

Leaflet on paper. Tiles are muted with a CSS filter on `.leaflet-tile-pane` (`saturate(.35) contrast(.92) brightness(1.03)`; at night `invert(1) hue-rotate(180deg) brightness(.75)` first) so the page's one ink stays the ink. Pins are 20px discs drawn in CSS and tell status by fill: **lost** is a filled Terracotta disc, **found** a Paper Card disc with a Terracotta ring, **reunited** a Paper Tinted disc with a muted ring. Clusters are a 30px Terracotta disc with the count in mono. Popups are notebook cards: Paper Card, a hairline, 10px radius, no shadow, ink text; the zoom control and attribution sit on card paper with hairlines. The legend mirrors the three fills. The class names (`dog-pin`, `dog-pin__dot`, `dog-pin__dot--{lost,found,reunited}`, `dog-pin-cluster`, `dog-pin-cluster__dot`) are load-bearing for the e2e suite and do not change.

### Wall Label (signature)

The `label-mono` utility. It is the placard beside every piece of work: the masthead kicker, the catalogue line under a plate, the status, dates, counts, footer column names. Any new section should introduce itself with one.

### Mark and Wordmark (signature)

The mark is the collar tag: a square plate of Terracotta ink — square corners, because squareness marks the work — with a bone-shaped dog tag cut out of it in paper. The bone is four lobes of radius 2.9 around a bar 4.2 units tall on a 24-unit grid, drawn after the plate as one `fill-rule="evenodd"` path so the tag is a true hole and whatever the mark sits on shows through. It is flat ink: no border, no gradient, no shadow.

Two candidates were rendered at 16 / 32 / 88 / 512px before choosing: (a) a round tag with a small ink dot for the ring hole, and (b) the bone. At 16px the round tag's hole was a one-pixel smudge and the hole-less disc read as a map pin rather than a tag; the bone still read as a bone at 16px, so it is the mark at every size and the round tag was dropped rather than kept for larger assets.

In the app it is `<LogoMark>` (`website/src/components/brand/Logo.tsx`), filled with `hsl(var(--primary))`, so it is Terracotta on paper by day and the lifted Terracotta at night with no `dark:` override.

The wordmark is "Find My Doggo" in Fraunces 700, tight tracking, Ink, with "Doggo" in Terracotta — one word in ink, the house device. Two lockups (`<Logo variant>`): **horizontal** is the mark, a 12px gap and the wordmark, with the mark exactly as tall as the wordmark's capitals; **stacked** is the mark above, a 12px gap and the wordmark centred beneath at half the mark's height. In the component the wordmark is live text in `font-display`; the static files have it converted to outlines and reference no font.

Clear space around any lockup is the bone's half-width (0.3 of the mark's height). Minimum size: 16px for the mark alone, 96px wide for a lockup. Do not rotate, recolour, outline, add a shadow or a gradient, or set the wordmark in another face. Files: `website/public/brand/` (`mark.svg`, `mark-dark.svg`, `mark-mono.svg`, `logo-horizontal{,-dark}.svg`, `logo-stacked{,-dark}.svg`, a `README.md`), the favicons and app icons in `website/public/` and `website/src/app/favicon.ico`, the manifest colours in `website/src/app/manifest.ts`, the Open Graph card in `website/src/app/opengraph-image.tsx`, and `docs/brand/lockups.png`; all regenerated by `npm run brand:generate` from `website/scripts/generate-brand.mjs`.

### Empty States

Honest, in the same voice: a wall label, one serif line, one primary action. No emoji, no illustration.

## Motion

**Content does not animate itself in.** Nothing on a page mounts hidden and waits for a scroll observer or a mount transition to become readable; the failure mode is a blank page. There are no entrance keyframes in the stylesheet and `initial={{ opacity: 0` fails the build.

What moves is the interface responding to the reader:

- **Hover and focus** transition at 150ms (fast), 200ms (default) or 300ms (slow) with `ease`.
- **The ink underline** scores in over 240ms on `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Buttons** press 1px down on `:active` over 100ms.
- **Loading** is `animate-pulse` and `animate-spin`.

Under `prefers-reduced-motion` every animation and transition collapses to `0.01ms` (not 0s, which can skip `transitionend`), with one stated exception: the two loading indicators slow to 3s rather than stopping, because a frozen loader reads as broken rather than as waiting.

## Do's and Don'ts

### Do:

- **Do** introduce every section, row and figure with a wall label before its title.
- **Do** divide with 1px sand hairlines and 64–96px of vertical space; let whitespace and rules do the structuring.
- **Do** spend Terracotta on action and emphasis only: links, hover, selection, pins, one primary button per view.
- **Do** keep dogs' photographs as square plates in a gallery grid, and build text-led lists as stacked hairline-divided rows.
- **Do** route every colour through the tokens; status is `text-destructive` (lost), `text-success` (found), `text-info` (reunited) and their `-muted` washes.
- **Do** keep numerals tabular in labels and oldstyle in display, and set every date and count in mono.
- **Do** design dark mode as the same notebook at night: cool hue-220 page, the ink lifted to `18 70% 72%`, hairlines at 18% lightness.
- **Do** give an empty section an honest empty state in the same voice: a wall label, one serif line, one primary action.
- **Do** keep the map's pin and cluster class names; the e2e suite counts them.

### Don't:

- **Don't** add shadows to content surfaces at rest or on hover; the header sheet and the CTA ledge are the only elevated objects.
- **Don't** reintroduce gradients, glow, or glass cards; the orange poster is gone.
- **Don't** use emoji as icons, logos or empty-state art.
- **Don't** put a status pill over a photograph; status is a mono label beside the facts.
- **Don't** use monospace as a voice. It is the label beside the work, never headings or body copy.
- **Don't** set Fraunces in body text, controls or labels, and don't set body copy in anything but Instrument Sans.
- **Don't** use neutral grey for rules or muted surfaces; every neutral is warm paper (hue 30–38) in light mode and cool night (hue 220) in dark.
- **Don't** introduce a second accent colour; Terracotta Soft exists for secondary fills and the four signal colours are for status only.
- **Don't** round a photo plate or scale it on hover; squareness marks the work.
- **Don't** define `--spacing-xs..4xl` tokens in `@theme`; in Tailwind v4 they shadow the `max-w-*` container scale and collapse layouts.
- **Don't** animate content in.

## Enforcement

Nine of the rules above are machine-checked, so breaking them fails the build the way a type error does. `website/scripts/check-design-system.mjs` runs in CI right after `lint`; run it locally from `website/` with:

```bash
npm run design:check                         # grouped, readable report
node scripts/check-design-system.mjs --json  # machine output
```

It reads `src/**/*.tsx` and `src/app/globals.css` (no dependencies, well under a second) and enforces:

| Rule             | What fails                                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `palette`        | `bg-/text-/border-/from-/…-{slate,zinc,neutral,stone,amber,yellow,lime,emerald,teal,cyan,sky,indigo,violet,purple,fuchsia,pink,rose}-NNN` anywhere in `src/`. Gray, orange, red, green and blue join this list as their ratchets reach zero. |
| `flat-paper`     | `shadow-{2xs…2xl}` or an arbitrary `shadow-[…]` outside the header sheet. _Active once the `shadow` ratchet reaches zero._                                                                    |
| `no-gradient`    | `bg-gradient-to-*`, `bg-linear-*`, `bg-radial`, `bg-conic`, or a `*-gradient(` in markup. _Active once the `gradient-utility` ratchet reaches zero._                                          |
| `one-glass`      | `backdrop-blur` outside the header.                                                                                                                                                           |
| `serif-speaks`   | `font-display` in a `className` on anything but `h1`–`h6`, a `*Title` primitive, or an element marked `data-voice="display"`.                                                                 |
| `tiny-font`      | `text-[Npx]` below 12px.                                                                                                                                                                      |
| `no-entrance`    | An `initial={{ opacity: 0` mount reveal, or an entrance keyframe by name (`animate-fade-in*`, `animate-slide-in-*`, `animate-glow-pulse`, `animate-shimmer`, `animate-marquee`).            |
| `css-gradient`   | A `*-gradient(` anywhere in `globals.css`.                                                                                                                                                    |
| `css-shadow`     | A `box-shadow` in `globals.css` outside the `cta-primary` utility (`box-shadow: none` is a removal and is allowed).                                                                            |
| `legacy-ratchet` | Any retired name still in the `LEGACY` table appearing more often than its recorded baseline.                                                                                                 |

The ratchet exists because the notebook lands in two PRs. Tokens, fonts, primitives, the brand, the shell and this document came first (2026-10-13) and recorded the baselines of what the page compositions still carry: `brand-orange` 57, `neutral-grey` 95, `status-hue` 40, `raw-white` 24, `hex-literal` 12, `shadow` 6, `gradient-utility` 1, `emoji` 8, `status-pill` 3. The pages PR takes every entry to zero and deletes it, at which point the matching hard rule takes over and the orange, grey, red, green and blue families join `palette`. Each legacy name's count may only fall; the PR that removes uses lowers the baseline.

What is _not_ checked is not thereby allowed — wall labels before sections, square plates, status as a label and the one-button-per-view rule still need a human eye.

Genuine exceptions live in one place: the `ALLOWLIST` constant at the top of the script, one entry per exception with a one-line reason. It currently exempts the header sheet (shadow and glass). Widening the allowlist is a policy decision and should read like one in the diff; loosening a rule's regex to make a violation disappear is not.
