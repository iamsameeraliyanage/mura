# Design System — Hospital Roster App

Tailwind CSS v4. The aesthetic brief: **a digital version of the paper roster the team already trusts** — calm, clinical, instantly legible at arm's length on a phone, with the colored-pen identity carried over from the handwritten sheets.

## The signature idea: "colored pens"

On the real paper rosters, each doctor is written in their own pen color (R in black ink, G in violet, Pu in green, D in red). Doctors recognize their color before they read their letter. **The app keeps this** — every person gets a pen color used consistently on calendar chips, fairness charts, and exports. This single decision makes the app feel familiar on day one and is the product's visual identity. Don't dilute it: everything around the chips stays quiet and neutral.

## Palette

Base: cool clinical neutrals (charting-paper white, slate ink). One brand accent: **scrub teal** — the color of theatre scrubs, used for primary actions and focus, nothing else. Duty flags get their own semantic colors, distinct from person colors.

### Tailwind v4 tokens (`src/styles/index.css`)

```css
@import "tailwindcss";

@theme {
  /* ── Neutrals: charting paper ── */
  --color-paper: #fafbfc;        /* app background */
  --color-sheet: #ffffff;        /* cards, calendar cells */
  --color-grid: #e4e9ee;         /* calendar grid lines, borders */
  --color-ink: #1b2733;          /* primary text — slate-ink, not pure black */
  --color-ink-soft: #5c6b7a;     /* secondary text, day numbers */
  --color-ink-faint: #93a1b0;    /* placeholders, disabled */

  /* ── Brand: scrub teal (actions, links, focus, active nav) ── */
  --color-scrub-50: #effaf8;
  --color-scrub-100: #d6f2ed;
  --color-scrub-500: #0d9488;
  --color-scrub-600: #0b7d73;    /* primary buttons */
  --color-scrub-700: #0a655e;    /* hover */
  --color-scrub-900: #07423e;

  /* ── Duty flags (semantic, NOT person colors) ── */
  --color-cash: #b45309;         /* casualty flag — amber ink */
  --color-cash-bg: #fdf2e3;
  --color-postcash: #4f46e5;     /* post-cash flag — indigo ink */
  --color-postcash-bg: #eef0fe;
  --color-weekend-bg: #f3f0fa;   /* weekend column tint (lavender-grey) */
  --color-holiday-bg: #fdf0f3;   /* PH day tint */

  /* ── States ── */
  --color-ok: #15803d;
  --color-ok-bg: #e9f7ee;
  --color-warn: #b45309;
  --color-warn-bg: #fdf2e3;
  --color-danger: #b91c1c;       /* validation conflicts */
  --color-danger-bg: #fdebeb;
  --color-draft: #6d28d9;        /* DRAFT status badge */
  --color-draft-bg: #f1ebfd;

  /* ── Person "pen" colors (assignable via StaffMember.colorKey) ── */
  --color-pen-black: #232a31;    /* R  — Dr. Lal Rathnasiri */
  --color-pen-black-bg: #eef1f4;
  --color-pen-violet: #7c3aed;   /* G  — Dr. Gihan */
  --color-pen-violet-bg: #f3edfd;
  --color-pen-green: #15803d;    /* Pu — Prof Unit */
  --color-pen-green-bg: #e9f7ee;
  --color-pen-red: #dc2626;      /* D  — Dr. Dinesha */
  --color-pen-red-bg: #fdecec;
  /* extra pens for SHO pool + future staff */
  --color-pen-blue: #2563eb;     /* S — Sulakshana */
  --color-pen-blue-bg: #eaf1fe;
  --color-pen-teal: #0d9488;     /* R(uwanda) */
  --color-pen-teal-bg: #e6f6f4;
  --color-pen-orange: #ea580c;   /* M — Mekala */
  --color-pen-orange-bg: #fdefe6;
  --color-pen-pink: #db2777;     /* U — Udara */
  --color-pen-pink-bg: #fdebf3;

  /* ── Type ── */
  --font-display: "Fraunces", Georgia, serif;       /* page titles, month name */
  --font-sans: "Inter", system-ui, sans-serif;       /* everything else */
  --font-mono: "JetBrains Mono", ui-monospace, monospace; /* tallies, dates, audit */
}
```

Admin can assign any `pen-*` key to new staff; the seed maps the current team as commented above.

## Typography

- **Fraunces (display)** — month headers ("June 2026"), page titles only. A warm serif gives the calendar the character of the hand-drawn sheet without being twee. Weight 600, tight tracking.
- **Inter (body/UI)** — labels, buttons, table text. Sizes: 12/13/14/16.
- **JetBrains Mono** — fairness tallies, audit timestamps, day numbers in cells. Tabular figures keep count columns aligned.

Load via Fontsource (`@fontsource-variable/fraunces`, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`) — no external network dependency.

## Core components

**Calendar (`MonthGrid`)** — the heart of the app.
- 7-col CSS grid, Mon–Sun. Cell: `bg-sheet border border-grid`, min-height 72px desktop / 56px mobile.
- Weekend columns get `bg-weekend-bg`; PH days `bg-holiday-bg` + tiny "PH" tag.
- Day number: top-left, `font-mono text-xs text-ink-soft`.
- **DutyChip**: the person, center of the cell — `rounded-md px-2 py-0.5 font-semibold text-sm`, colored `text-pen-X bg-pen-X-bg`. Flags render as small corner badges: ◆ cash (`text-cash`), ■ post-cash (`text-postcash`). 2nd on-call shows as a smaller secondary chip below.
- Drag & drop: dragging a chip lifts it with `shadow-lg scale-105`; valid drop targets get `ring-2 ring-scrub-500`; invalid targets `ring-danger` + shake. A swap = drag chip A onto chip B.
- Conflict slots: `ring-2 ring-danger` + danger badge with tooltip from `conflictReason`.

**FairnessPanel** — right sidebar (desktop) / bottom sheet (mobile). One row per active person: pen-color dot, name, mono tallies (on-call / cash / post-cash / weekends), and a thin horizontal bar comparing against pool average. Over-average = warn color. Updates optimistically on every swap.

**Status & publish** — DRAFT badge (`text-draft bg-draft-bg`), PUBLISHED (`text-ok bg-ok-bg`), "Published v3 · changed since SHO roster built" warning banner (`bg-warn-bg`) with a "Review conflicts" button.

**Validation drawer** — list of rule violations (V1–V9 from the schema doc), each with severity color and a "jump to day" link.

## Layout

- App shell: left nav (icons + labels; collapses to bottom tabs on mobile): Dashboard, Consultant Roster, SHO Roster, Staff, Settings, Audit.
- Max content width 1120px. Calendar fills width; fairness panel 280px fixed at ≥1024px.
- Mobile-first: the #1 real-world use is a doctor checking their day on a phone. The month grid must be readable at 360px — chips show shortCode only; tap a cell for a detail popover (full name, hours, flags, 2nd on-call).

## Export styles

- **Print/PDF**: `@media print` — hide nav/panels, black-on-white, grid lines darken to `#9aa7b3`, pen colors print as-is, footer: "Generated by [app] · {month} · v{version} · {publishedAt}".
- **WhatsApp image**: html-to-image renders an offscreen 1080px-wide version of MonthGrid on `bg-white` with a title bar (hospital · department · unit · month) — legible when WhatsApp compresses it.

## Quality floor

- Visible keyboard focus (`focus-visible:ring-2 ring-scrub-500`) on all interactive elements; chips reachable and swappable via keyboard (select → arrow keys → enter).
- `prefers-reduced-motion`: disable drag spring/shake animations.
- Contrast: all ink-on-bg pairs above meet WCAG AA (the pen bg tints are decorative; text uses the strong pen color on white).
- Sinhala/Tamil names will appear eventually — Inter covers Latin; add `Noto Sans Sinhala` fallback in the font stack now.
