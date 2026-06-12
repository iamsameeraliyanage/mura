// Public holidays: anyone authenticated can read (calendar display);
// only admins manage them (Settings page).
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { publicHolidayCreateSchema } from '../../shared/schemas'
import { db } from '../db'
import { writeAudit } from '../lib/audit'
import { requireAuth, requireRole, type AuthEnv } from '../middleware/auth'

export const holidayRoutes = new Hono<AuthEnv>()

holidayRoutes.use('*', requireAuth)

holidayRoutes.get('/', async (c) => {
  const month = c.req.query('month') // optional "YYYY-MM"
  return c.json(
    await db.publicHoliday.findMany({
      where: month
        ? {
            date: {
              gte: new Date(`${month}-01T00:00:00Z`),
              lt: nextMonthStart(month),
            },
          }
        : undefined,
      orderBy: { date: 'asc' },
    }),
  )
})

holidayRoutes.post(
  '/',
  requireRole('ADMIN'),
  zValidator('json', publicHolidayCreateSchema),
  async (c) => {
    const input = c.req.valid('json')
    const holiday = await db.publicHoliday.upsert({
      where: { date: new Date(`${input.date}T00:00:00Z`) },
      update: { name: input.name },
      create: { date: new Date(`${input.date}T00:00:00Z`), name: input.name },
    })
    await writeAudit({
      userId: c.get('user').id,
      action: 'CREATE',
      entity: 'PublicHoliday',
      entityId: holiday.id,
      after: holiday,
    })
    return c.json(holiday, 201)
  },
)

holidayRoutes.delete('/:id', requireRole('ADMIN'), async (c) => {
  const id = c.req.param('id')
  const holiday = await db.publicHoliday.findUnique({ where: { id } })
  if (!holiday) throw new HTTPException(404, { message: 'Holiday not found' })
  await db.publicHoliday.delete({ where: { id } })
  await writeAudit({
    userId: c.get('user').id,
    action: 'DELETE',
    entity: 'PublicHoliday',
    entityId: id,
    before: holiday,
  })
  return c.json({ ok: true })
})

function nextMonthStart(month: string): Date {
  const [y, m] = month.split('-').map(Number)
  return m === 12 ? new Date(`${y + 1}-01-01T00:00:00Z`) : new Date(Date.UTC(y, m, 1))
}
