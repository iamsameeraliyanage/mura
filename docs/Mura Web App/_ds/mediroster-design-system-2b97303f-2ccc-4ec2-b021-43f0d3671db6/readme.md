# MediRoster Design System

A design system for **MediRoster** — a hospital roster-management web app for Sri Lankan
hospital departments (first department: Paediatrics, Lady Ridgeway Hospital for Children).
The product is a calm, clinical, digital evolution of the handwritten paper duty rosters
doctors and nurses keep today.

> **Mura** is the maker; **MediRoster** is the product this system dresses.

## Sources

This system was built from a written design brief only — **no codebase or Figma file was
attached.** If you have those, link them here so future work can reference the source of truth:

- Codebase: _(none provided — please attach via the Import menu if one exists)_
- Figma: _(none provided)_
- Real roster data referenced in the brief: June 2026 (30 days, Mon–Sun), 4 consultants
  (R/G/Pu/D), 4 SHO/RHO (S/R/M/U); Pu casualty days 3, 8, 11, 19, 23, 27, 28; weekend
  blocks 6–7, 13–14, 20–21, 27–28; six-month history Dec 2025 – May 2026.

---

## The core idea — "Digital Colored Pens"

On the paper rosters every doctor writes in their own pen color; colleagues recognise the
color before they read the name. MediRoster keeps that identity system: each person owns a
**pen color**, shown as colored **DutyChips** on the calendar. The chips are the product's
signature and the visual focal point. Everything else — background, type, chrome — stays
quiet neutral so the pen colors are the only vivid thing on the page.

The 8 pens (see `tokens/pen-colors.css`):

| Code | Person | Role | Pen |
|------|--------|------|-----|
| R | Dr. Lal Rathnasiri | Consultant | dark slate |
| G | Dr. Gihan | Consultant | violet |
| Pu | Prof Unit / Dr. Kasun | Consultant | forest green |
| D | Dr. Dinesha | Consultant | red |
| S | Sulakshana | SHO/RHO | blue |
| R | Ruwanda | SHO/RHO | teal |
| M | Mekala | SHO/RHO | orange |
| U | Udara | SHO/RHO | pink/rose |

> Note: consultant **R** (Rathnasiri, slate) and SHO **R** (Ruwanda, teal) share the short
> code but not the color. In tokens/components the SHO pen id is `Rt` to disambiguate, while
> the chip still reads "R".

---

## CONTENT FUNDAMENTALS

How MediRoster writes copy:

- **Tone:** calm, clinical, factual. Like a well-kept medical chart — never playful, never
  salesy, never "corporate SaaS". Short declarative sentences.
- **Person:** addresses the reader plainly and names people directly ("Mekala is +29% over
  pool average", "Dinesha is on casualty and post-cash on June 15"). Uses real names and the
  letter codes, not roles in the abstract.
- **Casing:** Sentence case for everything — buttons ("Sign in", "Publish", "Generate"),
  headings, labels. The only UPPERCASE is the tiny tracked mini-labels (`EMAIL`, `LEGEND`,
  `STAFF`). Month titles are Title Case in the serif display ("June 2026").
- **Status words** are short and ALL-CAPS inside badges only: `DRAFT`, `PUBLISHED`.
- **Numbers:** always shown, always mono, always zero-padded for alignment in tallies
  (`07`, `03`). Percentages are signed ("+29%").
- **No emoji** anywhere in the UI. Check-marks (✓✓) and the duty glyphs (◆ ■ ⚠) are the only
  symbol characters used, and they are functional, not decorative.
- **Voice examples:**
  - Empty/help: "Account created by your department admin."
  - Conflict: "1 conflict on this roster — June 12, Mekala is on-call and transfer duty at once."
  - Confirmation copy stays operational: "June on-call roster — published. Tap to view your days."
- **Avoid:** exclamation marks, marketing adjectives ("powerful", "seamless"), hedging, and
  jargon a busy doctor wouldn't use at the bedside.

---

## VISUAL FOUNDATIONS

**Mood.** A well-designed medical chart; a Scandinavian hospital; the quiet confidence of a
good stethoscope. Calm, clinical, trustworthy. Always light — there is **no dark mode** (a
medical setting is always lit).

**Color.** Quiet neutral chrome carries the whole UI so the pen chips stay vivid:
- Background = charting paper `#fafbfc` (never pure white). Cards/cells = white `#ffffff`.
- Grid lines = soft blue-grey `#e4e9ee`. Text = dark slate-ink `#1b2733` (never pure black);
  secondary `#5c6b7a`.
- **One brand accent: scrub teal `#0d9488`** — used ONLY for primary buttons, active nav, and
  focus rings. Nothing else. No blue as a primary; never `#2563eb` for chrome.
- Duty semantics are distinct from pen colors: cash/casualty ◆ amber `#b45309` on warm cream;
  post-cash ■ indigo `#4f46e5` on soft lavender; conflict red `#b91c1c` ring; weekend cells a
  very subtle lavender-grey tint; public-holiday a soft rose tint.
- Status: DRAFT purple `#6d28d9`, PUBLISHED green `#15803d`.
- Pen colors are **saturated, not pastel** — they must stay readable on the printed/exported
  roster.

**Type.** Three families (`tokens/typography.css`):
- **Fraunces** (warm serif, 600) for display / month titles — gives the calendar the character
  of the handwritten sheet.
- **Inter** for all UI and body.
- **JetBrains Mono** for numbers, day cells, and tallies — tabular figures keep count columns
  perfectly aligned. Day numbers are zero-padded.
- Minimum comfortable UI size ~12px (mini-labels); body 15px; month title 34px.

**Spacing & shape.** 4px base scale. Tight, chart-like density. Radii are capped: **8px max on
cards/panels, 6px on chips and buttons, 4px on badges/inputs.** Nothing rounder.

**Borders & dividers.** Hairline `1px solid #e4e9ee` everywhere — between calendar cells, table
rows, panel sections. The grid is drawn with borders, not gaps, so it reads like ruled paper.

**Shadows.** Deliberately minimal — nothing heavier than `sm`. `xs` for resting buttons/cards,
`sm` for the login card and floating panels, and a single slightly-larger `lift` reserved for a
**dragged chip** and modal popovers. No ambient glow, no layered shadows.

**Backgrounds.** Flat charting-paper fill. **No gradients, no glassmorphism, no full-bleed hero
images, no textures.** The only "texture" is the calendar's own ruled grid.

**Animation.** Restrained and functional. Standard ease `cubic-bezier(0.2,0,0,1)`, fast
(120ms) / base (180ms). Used for: chip lift on drag (subtle shadow + `scale(1.05)`), drop-target
ring fades, fairness-bar width transitions, and chips animating into new positions after a swap.
No bounces, no infinite/decorative loops, no parallax.

**States.**
- *Hover:* quiet — a faint teal wash on nav, a hairline or background shift on rows; never a
  color explosion.
- *Press:* a 0.5px nudge down on buttons; no heavy depress.
- *Focus:* a 2px scrub-teal outline with 2px offset (`--teal-ring`) — the one place teal always
  appears.
- *Drag:* lifted chip gets `lift` shadow + 1.05 scale; valid drop = teal ring; invalid = red
  ring + gentle shake.
- *Conflict:* red ring around the chip + a ⚠ flag badge.

**Transparency / blur.** Used only for the modal scrim behind the day-detail popover
(`rgba(27,39,51,0.18)`). No blur effects elsewhere.

**Cards.** White fill, hairline border, 8px radius, `xs`–`sm` shadow at most. No colored
left-border accents, no gradient fills.

**Layout rules.** Desktop = fixed 236px left sidebar + fluid content + 280px FairnessPanel on
the calendar. Calendar is a 7-column Mon–Sun grid, 5–6 rows, min cell height 96px (64px compact).
Mobile (~360px) uses the same grid compacted, with bottom tab navigation and a tap-to-open day
popover. Everything must work from 360px to laptop.

---

## ICONOGRAPHY

- **System:** [Lucide](https://lucide.dev) line icons — 1.8px stroke, round caps/joins, 24px
  viewBox. This is a **substitution**: no icon assets were provided in the brief, and Lucide's
  calm, even-weight line style fits the clinical mood. A curated subset is hand-included in
  `ui_kits/mediroster/icons.jsx` (calendar, users, alert/triangle, cog, history, chevrons,
  share, download, plus, sparkle, search, lock, and a roster "logo" mark). Swap for the real
  icon set if one exists.
- **Duty glyphs** are intentionally *not* icons but typographic symbols, so they print and export
  cleanly: ◆ cash/casualty, ■ post-cash, ⚠ conflict. These are part of the FlagBadge component.
- **Brand mark:** a small ruled-calendar glyph (the `IcoLogo` in `icons.jsx`) in scrub teal beside
  the "MediRoster" wordmark (Fraunces 600). No standalone logo file was supplied — if you have one,
  drop it in `assets/` and replace the inline mark.
- **No emoji** in the UI. No PNG/sprite icon sets. WhatsApp's brand glyph (`IcoWhatsApp`) is the
  one filled icon, used only in export/share affordances.

---

## Index — what's in this system

**Foundations / tokens** (`tokens/`, all reached from root `styles.css`)
- `colors.css` — neutrals, scrub-teal accent, duty/status/fairness semantics
- `pen-colors.css` — the 8 signature pen colors (ink / bg / dot per person)
- `typography.css` — families, scale, weights, tracking
- `spacing.css` — spacing, radii (≤8px), shadows (≤sm), layout, motion
- `fonts.css` — Fraunces / Inter / JetBrains Mono (Google Fonts CDN — see Caveats)
- `base.css` — resets, charting-paper body, focus ring, `mr-*` helpers

**Components** (`components/`) — see each `*.prompt.md`
- `chips/` — **DutyChip** (signature), **FlagBadge**, **StatusBadge** + `PEN` map
- `calendar/` — **CalendarCell**, **MonthGrid** (desktop + `compact` mobile)
- `fairness/` — **FairnessRow**
- `buttons/` — **PrimaryButton** (solid / outline / destructive / ghost)
- `navigation/` — **NavItem** (sidebar + bottom-tab)
- `feedback/` — **ValidationAlert**

**UI kit** (`ui_kits/mediroster/`) — interactive recreation; entry `index.html`
- Login · Monthly Calendar (primary) · Fairness Dashboard · Audit Trail · Admin Config · WhatsApp share mockup

**Specimen cards** (`guidelines/`) — render in the Design System tab (Colors / Type / Spacing).

**SKILL.md** — makes this system usable as a downloadable Claude Skill.

---

## Caveats / substitutions
- **Fonts** load from the Google Fonts CDN (`tokens/fonts.css`). For production/offline, self-host
  the `.woff2` files and replace the `@import` with `@font-face` rules.
- **Icons** are Lucide (substitution — no source set was provided).
- No real logo file was supplied; the wordmark uses an inline glyph.
