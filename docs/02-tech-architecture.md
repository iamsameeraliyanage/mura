# Tech Architecture — Hospital Roster App

Companion to `01-roster-app-logic-summary.md` (business rules). This doc covers the stack, project structure, and deployment. Target: **100% free hosting** on Vercel + Neon.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React 18 + TypeScript | User's existing skills |
| Routing | React Router v6 | SPA routes |
| Server state | TanStack Query v5 | Caching, optimistic drag-drop updates, refetch on re-publish |
| HTTP | Axios (single instance + JWT interceptor) | User preference |
| Styling | Tailwind CSS v4 | See `04-design-system.md` |
| Drag & drop | dnd-kit | Touch-friendly, maintained |
| Dates | date-fns | Sri Lanka single timezone (Asia/Colombo), store UTC timestamps |
| Image export | html-to-image | WhatsApp share button |
| Backend | Hono on Vercel serverless functions | Express-like DX, no cold-sleep problem, free |
| ORM | Prisma | Schema in `03-database-schema.prisma` |
| Database | Neon Postgres (free tier) | Serverless-friendly, pooled connections |
| Validation | Zod (shared between client & server) | One source of truth for rules |
| Auth | JWT (jose) + bcryptjs, httpOnly cookie | Admin-created accounts, no self-signup |

## Why serverless (not Express on Render)

Render free tier sleeps after 15 min → 30s cold starts. Vercel serverless functions cold-start in ~200–500ms and never "sleep." Hono code is Express-like and ports back to a normal Node server later if needed.

## Project structure (single repo, single Vercel project)

```
roster-app/
├── api/
│   └── [[...route]].ts        # Vercel catch-all → Hono app (do not put logic here)
├── server/                     # All backend code (imported by api/)
│   ├── app.ts                  # Hono app: mounts routes + middleware
│   ├── routes/
│   │   ├── auth.ts             # POST /login, POST /logout, GET /me
│   │   ├── admin.ts            # hospitals, departments, units, staff, shifts, users
│   │   ├── rosters.ts          # CRUD, generate, publish, slots, swaps
│   │   ├── unavailability.ts
│   │   └── audit.ts
│   ├── services/
│   │   ├── generator/
│   │   │   ├── consultant.ts   # pure function — no DB imports
│   │   │   └── sho.ts          # pure function — no DB imports
│   │   ├── validation.ts       # rule checks (pure)
│   │   └── fairness.ts         # tally computation (pure)
│   ├── middleware/auth.ts      # JWT verify + role guard
│   └── db.ts                   # Prisma client singleton
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 # admin user + Pead department + staff
├── src/                        # Vite React SPA
│   ├── main.tsx, App.tsx, router.tsx
│   ├── api/                    # axios instance + React Query hooks
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── admin/              # config screens
│   │   ├── roster/
│   │   │   ├── ConsultantRoster.tsx
│   │   │   └── ShoRoster.tsx
│   │   └── Dashboard.tsx
│   ├── components/
│   │   ├── calendar/           # MonthGrid, DayCell, DutyChip (dnd-kit here)
│   │   ├── fairness/           # FairnessPanel, TallyTable
│   │   └── ui/                 # buttons, dialogs, toasts
│   └── styles/index.css        # Tailwind + design tokens
├── shared/                     # imported by BOTH src/ and server/
│   ├── types.ts                # DutyKind, RosterStatus, etc.
│   └── schemas.ts              # Zod schemas
├── vercel.json
├── package.json
└── .env.example
```

**Critical rule:** generator + validation + fairness are **pure TypeScript functions** (input: data, output: data; zero DB/HTTP imports). They get unit tests against the real June 2026 fixtures (`05-test-fixtures.json`).

## API surface (v1)

```
POST   /api/auth/login            { email, password } → sets httpOnly cookie
POST   /api/auth/logout
GET    /api/auth/me

# Admin only
GET/POST/PATCH /api/hospitals
GET/POST/PATCH /api/departments
GET/POST/PATCH /api/units
GET/POST/PATCH /api/staff                  # incl. activeFrom/activeUntil
GET/POST/PATCH /api/users                  # editor accounts + role + scope
GET/POST/PATCH /api/duty-config            # duty types & shift times per unit/layer

# Editors (scoped by role)
GET    /api/rosters?unitId&layer&month
POST   /api/rosters/generate               { unitId, layer, month } → draft
GET    /api/rosters/:id                    # with slots + validation report
PATCH  /api/rosters/:id/slots/:slotId      { staffId }            # swap (audited)
POST   /api/rosters/:id/publish
GET    /api/rosters/:id/validation         # rule violations list
GET    /api/fairness?unitId&layer&from&to  # cumulative tallies

GET/POST/DELETE /api/unavailability        { staffId, from, to, reason }
GET    /api/audit?rosterId
```

Publish flow: publishing a consultant roster sets `status=PUBLISHED`, bumps `version`, and recomputes the **revalidation report** for any existing SHO roster of the same month (mismatched cash days are flagged per-slot).

## Auth model

- No self-signup. Admin creates users with role: `ADMIN | CONSULTANT_EDITOR | SHO_EDITOR` (enum extensible for HO/MO/NURSE editors later), scoped to a unit.
- JWT in httpOnly, Secure, SameSite=Lax cookie. 7-day expiry.
- Middleware: `requireAuth` → `requireRole(...)` → `requireScope(unitId)`.

## Environment variables

```
DATABASE_URL=          # Neon POOLED connection string (-pooler host) — runtime
DIRECT_URL=            # Neon direct connection string — migrations only
JWT_SECRET=            # 32+ random bytes
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

Prisma datasource uses `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`.

## Deployment guide (step by step)

1. **GitHub:** push the repo.
2. **Neon** (neon.tech, free): create project `roster-app` → copy both connection strings (pooled + direct).
3. **Migrate + seed locally:** `.env` with both URLs → `npx prisma migrate deploy` → `npx prisma db seed`.
4. **Vercel:** Import the GitHub repo → Framework preset: Vite → add the env vars above → Deploy. The `/api` folder is auto-detected as serverless functions.
5. **vercel.json:** SPA fallback so React Router works:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```
6. **Verify:** log in as seeded admin → create staff → generate July 2026 consultant roster → compare against June fixture behavior.
7. **Every push to `main` auto-deploys.** Use preview deployments (every PR gets a URL) to show your wife changes before merging.

## Free-tier limits to know

| Service | Free limit | Roster app reality |
|---|---|---|
| Vercel | 100GB bandwidth/mo, serverless invocations generous | A department uses a tiny fraction |
| Neon | 0.5GB storage, autosuspend ~5min (cold resume <1s) | Years of roster data fits easily |

Neon's autosuspend is harmless — resume is sub-second, unlike Render's 30s.

## Later expansion path (no rewrite)

- More units/departments/hospitals → already in schema, add UI.
- Email notifications (Phase 2) → Resend free tier (3k emails/mo) from a serverless function on publish.
- Viewer website → public read-only route reading published rosters.
- If serverless ever constrains → `server/` mounts into a plain Node Hono server on a VPS unchanged.
