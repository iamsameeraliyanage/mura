// Read-only staff listing, hard-scoped to the caller's visible wards
// (roster admins see their ward; department admins their department; etc.).
// Mutations live in admin.ts.
import { Hono } from 'hono'
import { db } from '../db'
import { requireAuth, visibleUnitsWhere, type AuthEnv } from '../middleware/auth'

export const staffRoutes = new Hono<AuthEnv>()

staffRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const unitId = c.req.query('unitId')
  const unitScope = visibleUnitsWhere(user)
  return c.json(
    await db.staffMember.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        ...(unitScope ? { unit: unitScope } : {}),
      },
      include: { unavailability: { orderBy: { from: 'asc' } } },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
    }),
  )
})
