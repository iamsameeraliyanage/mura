# Build Plan — Hospital Roster App
*Milestone-by-milestone, from `npm create` to production on Vercel. Each milestone has acceptance criteria — don't move on until they pass.*

Reference docs: `01-roster-app-logic-summary.md` (rules) · `02-tech-architecture.md` (stack/structure) · `03-database-schema.prisma` (schema) · `04-design-system.md` (UI) · `05-test-fixtures.json` (real data for tests).

---

## M0 — Project scaffold (half a day)
- Vite React-TS app + Tailwind v4 with the design tokens from doc 04
- `server/` Hono app + `api/[[...route]].ts` Vercel adapter; `GET /api/health` returns `{ok:true}`
- `shared/` folder wired into both tsconfig paths
- Prisma init pointing at a local/Neon dev database
- Vitest configured (it will test the pure generator functions)
- ESLint + Prettier

**Accept:** `npm run dev` serves the SPA, `vercel dev` serves `/api/health`, `npx prisma migrate dev` runs.

## M1 — Schema, seed, fixtures (1 day)
- Copy `03-database-schema.prisma` → migrate
- `prisma/seed.ts`: admin user, Hospital → Paediatrics → Prof Unit, the 4 consultants + 4 SHO pool members (names/colors from fixtures), DutyConfig rows with Pead defaults, WeekendRotationState
- Load `05-test-fixtures.json` June rosters into the dev DB via a script (gives realistic data from day one)

**Accept:** Prisma Studio shows the June 2026 rosters exactly matching the fixtures.

## M2 — Auth (1 day)
- `POST /api/auth/login` (bcrypt verify → JWT in httpOnly cookie), `/logout`, `/me`
- `requireAuth`, `requireRole`, `requireScope(unitId)` middleware
- Frontend: Login page, axios withCredentials, React Query `useMe()`, route guards per role

**Accept:** admin, consultant-editor, and SHO-editor accounts see only their permitted routes; API rejects cross-role calls.

## M3 — Admin panel (2–3 days)
- CRUD screens: hospitals, departments, units, staff (kind, shortCode, pen color picker, activeFrom/Until, isSeat + currentHolder for Prof Unit), users (role + unit scope), DutyConfig editor (shift times, pool kinds), unavailability dates per person

**Accept:** a brand-new department can be configured end-to-end from the UI with different shift times than Pead.

## M4 — Consultant roster (the core, ~1 week)
- **Generator** (`server/services/generator/consultant.ts`, pure): inputs = month, active consultants, previous-month tail, unavailability, cumulative fairness; implements rules from doc 01 §3 (7–8 days each, 1 weekend block each, no back-to-back, 2–3 day gaps, cross-month check, 5th-weekend → needs-decision flag)
- **Validators** (`validation.ts`, pure): rules V1–V3, V7–V9
- Unit tests against fixtures (`generatorAcceptanceTests` list)
- **UI**: MonthGrid + DutyChips per design doc; dnd-kit swaps with optimistic React Query updates; FairnessPanel live tallies; validation drawer; DRAFT→publish flow; every mutation writes AuditLog
- Re-publish bumps version

**Accept:** all generator/validator tests green; Wasana's June roster can be reproduced via generate + a few swaps; publishing locks a version; audit shows every swap.

## M5 — SHO roster (~1 week)
- Unlock only when the month's consultant roster is PUBLISHED
- **Generator** (`sho.ts`, pure): cash days := consultant roster's Pu days; post-cash next day (different person, crosses month boundary); non-cash weekend = one person both days via WeekendRotationState; cash weekend = split; balance on-call/cash/post-cash with inverse compensation; 2nd on-call default = someone not on-call that day
- Validators V4–V6 + shared rules
- UI: same MonthGrid with ◆/■ flag badges + 2nd-on-call secondary chip
- **Revalidation:** on consultant re-publish, recompute conflicts for the SHO roster (`builtAgainstVersion` mismatch → per-slot `conflictFlag` + banner)

**Accept:** SHO generator output passes all fixture tests; moving a Pu day on the consultant roster and re-publishing flags exactly the affected SHO slots.

## M6 — History, export, share (2–3 days)
- Audit viewer page (filter by roster, diff before/after)
- Fairness dashboard: cumulative multi-month view (reproduce the 6-month summary table from the original PDF)
- Print stylesheet (notice-board view)
- "Share to WhatsApp" — html-to-image PNG download of the published month

**Accept:** the exported PNG is legible on a phone after WhatsApp compression; printed page fits A4 landscape.

## M7 — Deployment (half a day)
- Follow doc 02 §Deployment: Neon prod DB → migrate + seed → Vercel project + env vars → smoke test
- Set up Vercel preview deployments for PRs

**Accept:** production URL works end-to-end with real accounts; July 2026 roster generated, edited, published, exported, and shared in the family WhatsApp group 🎉

## M8 — Pilot month
- Wasana + Ruwanda build July/August for real, in parallel with paper
- Collect friction notes → fix → retire the paper

---

# CLAUDE.md (copy this into the repo root)

```markdown
# Hospital Roster App

Roster management for Sri Lankan hospital departments. Phase 1: Paediatrics dept,
Prof Unit — consultant casualty roster + SHO/RHO roster.

## Read first
- docs/01-roster-app-logic-summary.md — ALL business rules (verified with the
  doctors who run this roster; do not re-interpret, ask if ambiguous)
- docs/02-tech-architecture.md — stack & structure
- docs/03-database-schema.prisma — schema (source of truth = prisma/schema.prisma)
- docs/04-design-system.md — Tailwind tokens & component specs
- docs/05-test-fixtures.json — REAL roster data; generators/validators must
  satisfy generatorAcceptanceTests

## Stack
Vite + React 18 + TS + Tailwind v4 + React Router + TanStack Query + Axios +
dnd-kit · Hono on Vercel serverless (api/[[...route]].ts) · Prisma + Neon
Postgres · Zod shared schemas · JWT httpOnly cookie auth.

## Hard rules
1. Generator/validation/fairness code in server/services/ stays PURE — no DB,
   no HTTP imports. All of it unit-tested with Vitest against docs/05 fixtures.
2. One DutySlot per day per roster. The person IS the on-call; cash/post-cash
   are flags. Never model them as separate slots.
3. Every mutation writes an AuditLog row (who/what/before/after).
4. Store real UTC timestamps; render in Asia/Colombo. Shifts cross midnight
   and month boundaries.
5. No self-signup. Admin creates users. Role+unit scope enforced in middleware
   AND hidden in UI.
6. Person "pen colors" come from StaffMember.colorKey → design-token classes.
   Never hardcode hex in components.
7. Keep shared/ types and Zod schemas as the single source for both sides.

## Commands
npm run dev · npm run test · npx prisma migrate dev · npx prisma db seed ·
vercel dev (full stack locally)

## Definition of done per feature
Tests green · validators clean on fixtures · audit row written · works at
360px mobile width · keyboard accessible · matches design tokens.
```
