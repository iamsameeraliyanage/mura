// Read-only staff listing for any authenticated user (editors need the pool
// for roster views and unavailability marking). Mutations live in admin.ts.
import { Hono } from 'hono'
import { db } from '../db'
import { requireAuth, type AuthEnv } from '../middleware/auth'

export const staffRoutes = new Hono<AuthEnv>()

staffRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const queryUnitId = c.req.query('unitId')
  // Editors are hard-scoped to their unit; admins may filter freely.
  const unitId = user.role === 'ADMIN' ? queryUnitId : (user.unitId ?? '__none__')
  return c.json(
    await db.staffMember.findMany({
      where: unitId ? { unitId } : undefined,
      include: { unavailability: { orderBy: { from: 'asc' } } },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
    }),
  )
})
