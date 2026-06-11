# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**mura** — roster management for Sri Lankan hospital departments. Phase 1: Paediatrics department, Prof Unit — consultant casualty roster + SHO/RHO on-call roster.

**Read the docs before touching business logic:**

- [docs/01-roster-app-logic-summary.md](docs/01-roster-app-logic-summary.md) — all business rules, verified with the doctors who run this roster. Do not re-interpret; ask if ambiguous.
- [docs/02-tech-architecture.md](docs/02-tech-architecture.md) — stack, project structure, API surface, deployment.
- [docs/03-database-schema.prisma](docs/03-database-schema.prisma) — schema reference (source of truth once built: `prisma/schema.prisma`).
- [docs/04-design-system.md](docs/04-design-system.md) — Tailwind v4 tokens and component specs.
- [docs/05-test-fixtures.json](docs/05-test-fixtures.json) — real paper-roster data (Dec 2025 – June 2026); generators and validators must satisfy `generatorAcceptanceTests`.
- [docs/06-build-plan-and-claude-md.md](docs/06-build-plan-and-claude-md.md) — milestone build plan (M0–M8).

## Commands

```bash
npm run dev          # Vite SPA dev server
vercel dev           # full-stack local (SPA + Hono serverless on /api)
npm run test         # Vitest (unit-tests the pure generator/validator functions)
npm run lint         # ESLint + Prettier
npx prisma migrate dev   # apply schema changes to dev DB
npx prisma db seed       # seed admin user, Pead dept, staff, fixture rosters
npx prisma studio        # inspect DB in browser
```

Run a single test file: `npx vitest run src/path/to/file.test.ts`

## Stack

| Layer        | Choice                                                                            |
| ------------ | --------------------------------------------------------------------------------- |
| Frontend     | Vite + React 18 + TypeScript                                                      |
| Routing      | React Router v6                                                                   |
| Server state | TanStack Query v5                                                                 |
| HTTP         | Axios (single instance + JWT interceptor)                                         |
| Styling      | Tailwind CSS v4 (tokens in `src/styles/index.css`)                                |
| Drag & drop  | dnd-kit                                                                           |
| Dates        | date-fns — all datetimes stored UTC, rendered as `Asia/Colombo`                   |
| Image export | html-to-image                                                                     |
| Backend      | Hono mounted in `api/[[...route]].ts` (Vercel catch-all)                          |
| ORM          | Prisma                                                                            |
| Database     | Neon Postgres (pooled via `DATABASE_URL`; direct via `DIRECT_URL` for migrations) |
| Validation   | Zod schemas in `shared/schemas.ts` — shared by both sides                         |
| Auth         | JWT (jose) + bcryptjs in httpOnly cookie                                          |

## Project structure

```
api/[[...route]].ts          # Vercel adapter — do not put logic here
server/
  app.ts                     # Hono app: routes + middleware
  routes/                    # auth, admin, rosters, unavailability, audit
  services/
    generator/
      consultant.ts          # PURE function — no DB/HTTP imports
      sho.ts                 # PURE function — no DB/HTTP imports
    validation.ts            # PURE
    fairness.ts              # PURE
  middleware/auth.ts         # requireAuth / requireRole / requireScope
  db.ts                      # Prisma singleton
prisma/
  schema.prisma
  seed.ts
src/                         # Vite SPA
  api/                       # axios instance + React Query hooks
  pages/
    roster/
      ConsultantRoster.tsx
      ShoRoster.tsx
  components/
    calendar/                # MonthGrid, DayCell, DutyChip (dnd-kit here)
    fairness/                # FairnessPanel, TallyTable
    ui/
shared/
  types.ts                   # DutyKind, RosterStatus, etc.
  schemas.ts                 # Zod schemas
```

## Hard rules

1. **Pure service functions.** `server/services/generator/`, `validation.ts`, and `fairness.ts` take data and return data — zero DB or HTTP imports. All unit-tested with Vitest against the `docs/05` fixtures.
2. **One DutySlot per day per roster.** The assigned person IS the on-call; `isCash` and `isPostCash` are boolean flags on that slot. Never create separate slots for cash or post-cash.
3. **Every mutation writes an AuditLog row** (userId, action, entity, entityId, before, after).
4. **Real UTC timestamps; render in Asia/Colombo.** Shifts cross midnight and month boundaries — `startsAt`/`endsAt` are full datetimes.
5. **No self-signup.** Admin creates users. `ADMIN | CONSULTANT_EDITOR | SHO_EDITOR` roles enforced in middleware (`requireRole`) _and_ hidden in UI. Editors are scoped to a unit.
6. **Pen colors from tokens only.** `StaffMember.colorKey` maps to `--color-pen-*` design tokens. Never hardcode hex values in components.
7. **`shared/` is the single source of truth** for types and Zod schemas — imported by both `src/` and `server/`.
8. **SHO roster unlocks only after the consultant roster is PUBLISHED** for that month.
9. **Consultant re-publish** bumps `version` and triggers revalidation of any existing SHO roster (`builtAgainstVersion` mismatch → per-slot `conflictFlag`).

## Key domain concepts

**Consultant roster:**

- 4 consultants: R (black), G (violet), Pu/Prof Unit (green, a seat not a person), D (red).
- Each gets 7–8 casualty days and exactly 1 weekend block per month.
- No back-to-back days (except within a consultant's own weekend block). Generator checks the previous month's tail.

**SHO/RHO roster:**

- One combined pool (currently 4: S, R, M, U). Pool turns over frequently — adding/removing members and rebalancing must be effortless.
- Cash days = days when Pu is on consultant casualty. Post-cash = the day after a cash day, assigned to someone other than the previous day's cash person.
- Non-cash weekend: one person covers Sat+Sun (counts as 2 on-calls), fixed rotation carried across months via `WeekendRotationState`.
- Cash weekend: split between 2 different people (Sat ≠ Sun); the following Monday is post-cash.
- On-call, cash, and post-cash counts are balanced separately and inversely compensate (more cash → less post-cash).

**Validation rules (V1–V9)** are listed as comments at the bottom of `docs/03-database-schema.prisma`.

## Environment variables

```
DATABASE_URL=        # Neon POOLED connection string
DIRECT_URL=          # Neon direct connection string (migrations only)
JWT_SECRET=          # 32+ random bytes
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

## Definition of done per feature

Tests green · validators produce zero violations on `docs/05` fixtures · audit row written per mutation · works at 360px mobile width · keyboard accessible (focus-visible ring) · design tokens used throughout.
