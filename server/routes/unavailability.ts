// Unavailable dates per staff member ("Dr. Gihan away 10th–15th").
// Editors manage these for their own unit; admins for any unit.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { unavailabilityCreateSchema } from '../../shared/schemas'
import { db } from '../db'
import { writeAudit } from '../lib/audit'
import { assertScope, requireAuth, type AuthEnv } from '../middleware/auth'

export const unavailabilityRoutes = new Hono<AuthEnv>()

unavailabilityRoutes.use('*', requireAuth)

const day = (d: string) => new Date(`${d}T00:00:00.000Z`)

unavailabilityRoutes.get('/', async (c) => {
  const staffId = c.req.query('staffId')
  const unitId = c.req.query('unitId')
  return c.json(
    await db.unavailabilityDate.findMany({
      where: {
        ...(staffId ? { staffId } : {}),
        ...(unitId ? { staff: { unitId } } : {}),
      },
      include: { staff: { select: { id: true, fullName: true, shortCode: true, unitId: true } } },
      orderBy: { from: 'asc' },
    }),
  )
})

unavailabilityRoutes.post('/', zValidator('json', unavailabilityCreateSchema), async (c) => {
  const input = c.req.valid('json')
  const staff = await db.staffMember.findUnique({ where: { id: input.staffId } })
  if (!staff) throw new HTTPException(404, { message: 'Staff member not found' })
  assertScope(c, staff.unitId)

  const row = await db.unavailabilityDate.create({
    data: {
      staffId: input.staffId,
      from: day(input.from),
      to: day(input.to),
      reason: input.reason,
    },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: 'CREATE',
    entity: 'UnavailabilityDate',
    entityId: row.id,
    after: row,
  })
  return c.json(row, 201)
})

unavailabilityRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const row = await db.unavailabilityDate.findUnique({ where: { id }, include: { staff: true } })
  if (!row) throw new HTTPException(404, { message: 'Not found' })
  assertScope(c, row.staff.unitId)

  await db.unavailabilityDate.delete({ where: { id } })
  await writeAudit({
    userId: c.get('user').id,
    action: 'DELETE',
    entity: 'UnavailabilityDate',
    entityId: id,
    before: row,
  })
  return c.json({ ok: true })
})
