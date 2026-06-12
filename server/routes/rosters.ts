// Roster CRUD, generation, swaps, publish (docs/02 §API). Any authenticated
// user may VIEW rosters; mutations require the layer's editor role (or admin).
import { Hono, type Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Roster, RosterLayer } from '@prisma/client'
import { rosterLayerSchema, rosterMonthSchema, dateStringSchema } from '../../shared/schemas'
import { db } from '../db'
import { writeAudit } from '../lib/audit'
import { assertScope, requireAuth, type AuthEnv, type AuthUser } from '../middleware/auth'
import { generateConsultantRoster } from '../services/generator/consultant'
import { generateShoRoster } from '../services/generator/sho'
import { tallyConsultant, tallySho, mergeTallies } from '../services/fairness'
import { validateRoster } from '../services/validation'
import {
  colomboInstant,
  getPool,
  getPreviousTail,
  getPriorSlots,
  getPuDays,
  getShiftTimes,
  getValidationContext,
  slotToLike,
  toDateString,
} from '../services/roster-context'
import { addDays } from '../services/dates'

export const rosterRoutes = new Hono<AuthEnv>()
rosterRoutes.use('*', requireAuth)

function assertLayerEditor(user: AuthUser, layer: RosterLayer) {
  if (user.role === 'ADMIN') return
  const required = layer === 'CONSULTANT' ? 'CONSULTANT_EDITOR' : 'SHO_EDITOR'
  if (user.role !== required) {
    throw new HTTPException(403, { message: `Requires ${required} role` })
  }
}

const slotInclude = {
  slots: {
    include: {
      staff: { select: { id: true, fullName: true, shortCode: true, colorKey: true, kind: true } },
      secondOnCall: { select: { id: true, fullName: true, shortCode: true, colorKey: true } },
    },
    orderBy: { date: 'asc' as const },
  },
}

async function rosterWithReport(rosterId: string) {
  const roster = await db.roster.findUnique({ where: { id: rosterId }, include: slotInclude })
  if (!roster) throw new HTTPException(404, { message: 'Roster not found' })
  const ctx = await getValidationContext(roster)
  const violations = validateRoster(
    { layer: roster.layer, month: roster.month, slots: roster.slots.map(slotToLike) },
    ctx,
  )
  return { roster, violations }
}

async function buildSlotTimes(roster: Roster, date: string) {
  const times = await getShiftTimes(roster.unitId, roster.layer)
  return {
    startsAt: colomboInstant(date, times.start),
    endsAt: colomboInstant(addDays(date, 1), times.endNextDay),
  }
}

// ── Read ──

rosterRoutes.get('/', async (c) => {
  const query = z
    .object({ unitId: z.string(), layer: rosterLayerSchema, month: rosterMonthSchema })
    .safeParse(c.req.query())
  if (!query.success) throw new HTTPException(400, { message: 'unitId, layer, month required' })
  const { unitId, layer, month } = query.data

  const roster = await db.roster.findUnique({
    where: { unitId_layer_month: { unitId, layer, month } },
    include: slotInclude,
  })
  if (!roster) return c.json({ roster: null, violations: [] })
  const { violations } = await rosterWithReport(roster.id)
  return c.json({ roster, violations })
})

rosterRoutes.get('/:id', async (c) => c.json(await rosterWithReport(c.req.param('id'))))

rosterRoutes.get('/:id/validation', async (c) => {
  const { violations } = await rosterWithReport(c.req.param('id'))
  return c.json(violations)
})

// ── Generate ──

const generateSchema = z.object({
  unitId: z.string(),
  layer: rosterLayerSchema,
  month: rosterMonthSchema,
})

rosterRoutes.post('/generate', zValidator('json', generateSchema), async (c) => {
  const { unitId, layer, month } = c.req.valid('json')
  const user = c.get('user')
  assertLayerEditor(user, layer)
  assertScope(c, unitId)

  const existing = await db.roster.findUnique({
    where: { unitId_layer_month: { unitId, layer, month } },
  })
  if (existing?.status === 'PUBLISHED') {
    throw new HTTPException(409, {
      message: 'A published roster exists for this month — edit it instead of regenerating',
    })
  }

  const pool = await getPool(unitId, layer, month)
  const monthStart = `${month}-01`
  const monthEndDate = addDays(`${month}-28`, 4).slice(0, 10) // safely past month end
  const activeIn = (from: Date, until: Date | null) =>
    toDateString(from) <= monthEndDate && (!until || toDateString(until) >= monthStart)
  const activePool = pool.filter((p) => activeIn(p.activeFrom, p.activeUntil))

  const unavailability = await db.unavailabilityDate.findMany({
    where: { staffId: { in: activePool.map((p) => p.id) } },
  })
  const unavailable: Record<string, string[]> = {}
  for (const u of unavailability) {
    const list = (unavailable[u.staffId] ??= [])
    for (let d = toDateString(u.from); d <= toDateString(u.to); d = addDays(d, 1)) {
      if (d.startsWith(month)) list.push(d)
    }
  }

  const previousTail = await getPreviousTail(unitId, layer, month)
  const priorSlots = await getPriorSlots(unitId, layer, month)

  let assignments: {
    date: string
    staffId: string
    isWeekendBlock?: boolean
    isCash?: boolean
    isPostCash?: boolean
  }[]

  if (layer === 'CONSULTANT') {
    const result = generateConsultantRoster({
      month,
      consultants: activePool.map((p) => ({ id: p.id })),
      unavailable,
      previousTail,
      cumulative: tallyConsultant(priorSlots),
    })
    assignments = result.assignments
  } else {
    const puDays = await getPuDays(unitId, month)
    if (!puDays) {
      throw new HTTPException(409, {
        message: 'The consultant roster for this month must be published first',
      })
    }
    const rotation = await db.weekendRotationState.findUnique({
      where: { unitId_layer: { unitId, layer } },
    })
    const result = generateShoRoster({
      month,
      pool: activePool.map((p) => ({
        id: p.id,
        activeFrom: toDateString(p.activeFrom),
        activeUntil: p.activeUntil ? toDateString(p.activeUntil) : null,
      })),
      puDays,
      unavailable,
      previousTail,
      cumulative: tallySho(priorSlots),
      rotationOrder: rotation?.rotationOrder ?? activePool.map((p) => p.id),
      lastNonCashWeekendId: rotation?.lastAssignedId ?? null,
    })
    assignments = result.assignments
  }

  const times = await getShiftTimes(unitId, layer)
  const consultantVersion =
    layer === 'SHO'
      ? (
          await db.roster.findUnique({
            where: { unitId_layer_month: { unitId, layer: 'CONSULTANT', month } },
          })
        )?.version
      : undefined

  const roster = await db.$transaction(async (tx) => {
    if (existing) await tx.roster.delete({ where: { id: existing.id } }) // cascades slots
    return tx.roster.create({
      data: {
        unitId,
        layer,
        month,
        status: 'DRAFT',
        builtAgainstVersion: consultantVersion,
        slots: {
          create: assignments.map((a) => ({
            date: new Date(`${a.date}T00:00:00.000Z`),
            staffId: a.staffId,
            startsAt: colomboInstant(a.date, times.start),
            endsAt: colomboInstant(addDays(a.date, 1), times.endNextDay),
            isWeekendBlock: a.isWeekendBlock ?? false,
            isCash: a.isCash ?? false,
            isPostCash: a.isPostCash ?? false,
          })),
        },
      },
    })
  })

  await writeAudit({
    userId: user.id,
    action: existing ? 'UPDATE' : 'CREATE',
    entity: 'Roster',
    entityId: roster.id,
    after: { unitId, layer, month, generated: assignments.length },
  })

  const { roster: full, violations } = await rosterWithReport(roster.id)
  return c.json({ roster: full, violations }, 201)
})

// ── Edit slots ──

const assignSchema = z.object({
  staffId: z.string(),
  isCash: z.boolean().optional(),
  isPostCash: z.boolean().optional(),
  isWeekendBlock: z.boolean().optional(),
})

async function loadEditableRoster(c: Context<AuthEnv>) {
  const roster = await db.roster.findUnique({ where: { id: c.req.param('id') } })
  if (!roster) throw new HTTPException(404, { message: 'Roster not found' })
  const user = c.get('user')
  assertLayerEditor(user, roster.layer)
  assertScope(c, roster.unitId)
  return roster
}

rosterRoutes.patch('/:id/slots/:slotId', zValidator('json', assignSchema), async (c) => {
  const roster = await loadEditableRoster(c)
  const input = c.req.valid('json')
  const before = await db.dutySlot.findUnique({ where: { id: c.req.param('slotId') } })
  if (!before || before.rosterId !== roster.id) {
    throw new HTTPException(404, { message: 'Slot not found' })
  }
  const after = await db.dutySlot.update({
    where: { id: before.id },
    data: {
      staffId: input.staffId,
      isCash: input.isCash,
      isPostCash: input.isPostCash,
      isWeekendBlock: input.isWeekendBlock,
      conflictFlag: false,
      conflictReason: null,
    },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: 'SWAP',
    entity: 'DutySlot',
    entityId: before.id,
    before,
    after,
  })
  const { roster: full, violations } = await rosterWithReport(roster.id)
  return c.json({ roster: full, violations })
})

/** Atomic two-slot swap — the drag-a-chip-onto-another-chip gesture. */
rosterRoutes.patch(
  '/:id/swap',
  zValidator('json', z.object({ slotAId: z.string(), slotBId: z.string() })),
  async (c) => {
    const roster = await loadEditableRoster(c)
    const { slotAId, slotBId } = c.req.valid('json')
    const [a, b] = await Promise.all([
      db.dutySlot.findUnique({ where: { id: slotAId } }),
      db.dutySlot.findUnique({ where: { id: slotBId } }),
    ])
    if (!a || !b || a.rosterId !== roster.id || b.rosterId !== roster.id) {
      throw new HTTPException(404, { message: 'Slot not found' })
    }
    await db.$transaction([
      db.dutySlot.update({
        where: { id: a.id },
        data: { staffId: b.staffId, conflictFlag: false, conflictReason: null },
      }),
      db.dutySlot.update({
        where: { id: b.id },
        data: { staffId: a.staffId, conflictFlag: false, conflictReason: null },
      }),
    ])
    await writeAudit({
      userId: c.get('user').id,
      action: 'SWAP',
      entity: 'DutySlot',
      entityId: `${a.id}+${b.id}`,
      before: { [toDateString(a.date)]: a.staffId, [toDateString(b.date)]: b.staffId },
      after: { [toDateString(a.date)]: b.staffId, [toDateString(b.date)]: a.staffId },
    })
    const { roster: full, violations } = await rosterWithReport(roster.id)
    return c.json({ roster: full, violations })
  },
)

/** Assign an unassigned day (e.g. the 5th-weekend needs-decision pair). */
rosterRoutes.put('/:id/days/:date', zValidator('json', assignSchema), async (c) => {
  const roster = await loadEditableRoster(c)
  const date = dateStringSchema.parse(c.req.param('date'))
  if (!date.startsWith(roster.month)) {
    throw new HTTPException(400, { message: 'Date is outside the roster month' })
  }
  const input = c.req.valid('json')
  const { startsAt, endsAt } = await buildSlotTimes(roster, date)
  const existing = await db.dutySlot.findUnique({
    where: { rosterId_date: { rosterId: roster.id, date: new Date(`${date}T00:00:00.000Z`) } },
  })
  const slot = existing
    ? await db.dutySlot.update({
        where: { id: existing.id },
        data: {
          staffId: input.staffId,
          isCash: input.isCash,
          isPostCash: input.isPostCash,
          isWeekendBlock: input.isWeekendBlock,
          conflictFlag: false,
          conflictReason: null,
        },
      })
    : await db.dutySlot.create({
        data: {
          rosterId: roster.id,
          date: new Date(`${date}T00:00:00.000Z`),
          staffId: input.staffId,
          startsAt,
          endsAt,
          isCash: input.isCash ?? false,
          isPostCash: input.isPostCash ?? false,
          isWeekendBlock: input.isWeekendBlock ?? false,
        },
      })
  await writeAudit({
    userId: c.get('user').id,
    action: existing ? 'SWAP' : 'CREATE',
    entity: 'DutySlot',
    entityId: slot.id,
    before: existing,
    after: slot,
  })
  const { roster: full, violations } = await rosterWithReport(roster.id)
  return c.json({ roster: full, violations })
})

/** Set/replace the 2nd on-call (transfer duty) for a day. */
rosterRoutes.patch(
  '/:id/slots/:slotId/second-on-call',
  zValidator('json', z.object({ staffId: z.string().nullable() })),
  async (c) => {
    const roster = await loadEditableRoster(c)
    const before = await db.dutySlot.findUnique({ where: { id: c.req.param('slotId') } })
    if (!before || before.rosterId !== roster.id) {
      throw new HTTPException(404, { message: 'Slot not found' })
    }
    const after = await db.dutySlot.update({
      where: { id: before.id },
      data: { secondOnCallId: c.req.valid('json').staffId },
    })
    await writeAudit({
      userId: c.get('user').id,
      action: 'SWAP',
      entity: 'DutySlot',
      entityId: before.id,
      before,
      after,
    })
    const { roster: full, violations } = await rosterWithReport(roster.id)
    return c.json({ roster: full, violations })
  },
)

// ── Publish ──

rosterRoutes.post('/:id/publish', async (c) => {
  const roster = await loadEditableRoster(c)
  const isRepublish = roster.status === 'PUBLISHED'

  const updated = await db.roster.update({
    where: { id: roster.id },
    data: {
      status: 'PUBLISHED',
      version: isRepublish ? { increment: 1 } : undefined,
      publishedAt: new Date(),
    },
  })

  // Consultant (re-)publish: revalidate any SHO roster built against it —
  // mismatched cash days get per-slot conflict flags (docs/01 §5.7).
  if (roster.layer === 'CONSULTANT') {
    await revalidateShoAgainstConsultant(updated.unitId, updated.month, updated.version)
  }

  // SHO publish: persist the non-cash weekend rotation pointer for next month.
  if (roster.layer === 'SHO') {
    await updateRotationState(updated.unitId, updated.id)
  }

  await writeAudit({
    userId: c.get('user').id,
    action: isRepublish ? 'REPUBLISH' : 'PUBLISH',
    entity: 'Roster',
    entityId: roster.id,
    after: { status: 'PUBLISHED', version: updated.version },
  })

  const { roster: full, violations } = await rosterWithReport(roster.id)
  return c.json({ roster: full, violations })
})

async function revalidateShoAgainstConsultant(unitId: string, month: string, version: number) {
  const sho = await db.roster.findUnique({
    where: { unitId_layer_month: { unitId, layer: 'SHO', month } },
    include: { slots: true },
  })
  if (!sho) return

  const puDays = new Set((await getPuDays(unitId, month)) ?? [])
  for (const slot of sho.slots) {
    const date = toDateString(slot.date)
    const shouldBeCash = puDays.has(date)
    const mismatch = slot.isCash !== shouldBeCash
    if (mismatch !== slot.conflictFlag) {
      await db.dutySlot.update({
        where: { id: slot.id },
        data: {
          conflictFlag: mismatch,
          conflictReason: mismatch
            ? shouldBeCash
              ? `Consultant roster v${version}: ${date} is now a Pu casualty day (cash)`
              : `Consultant roster v${version}: ${date} is no longer a Pu casualty day`
            : null,
        },
      })
    }
  }
}

async function updateRotationState(unitId: string, rosterId: string) {
  const roster = await db.roster.findUnique({
    where: { id: rosterId },
    include: { slots: { orderBy: { date: 'asc' } } },
  })
  if (!roster) return
  const byDate = new Map(roster.slots.map((s) => [toDateString(s.date), s]))
  let last: string | null = null
  for (const slot of roster.slots) {
    const date = toDateString(slot.date)
    if (new Date(`${date}T00:00:00Z`).getUTCDay() !== 6 || slot.isCash) continue
    const sun = byDate.get(addDays(date, 1))
    if (sun && sun.staffId === slot.staffId && !sun.isCash) last = slot.staffId
  }
  if (last) {
    await db.weekendRotationState.updateMany({
      where: { unitId, layer: 'SHO' },
      data: { lastAssignedId: last },
    })
  }
}

// ── Fairness ──

export const fairnessRoutes = new Hono<AuthEnv>()
fairnessRoutes.use('*', requireAuth)

fairnessRoutes.get('/', async (c) => {
  const query = z
    .object({
      unitId: z.string(),
      layer: rosterLayerSchema,
      from: rosterMonthSchema.optional(),
      to: rosterMonthSchema.optional(),
    })
    .safeParse(c.req.query())
  if (!query.success) throw new HTTPException(400, { message: 'unitId and layer required' })
  const { unitId, layer, from, to } = query.data

  const rosters = await db.roster.findMany({
    where: {
      unitId,
      layer,
      ...(from || to
        ? { month: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    include: { slots: true },
    orderBy: { month: 'asc' },
  })

  const perMonth = rosters.map((r) => ({
    month: r.month,
    status: r.status,
    tally:
      layer === 'CONSULTANT'
        ? tallyConsultant(r.slots.map(slotToLike))
        : tallySho(r.slots.map(slotToLike)),
  }))
  const cumulative = mergeTallies(
    perMonth.map((m) => m.tally) as unknown as Record<string, Record<string, number>>[],
  )

  const staff = await db.staffMember.findMany({
    where: { unitId },
    select: {
      id: true,
      fullName: true,
      shortCode: true,
      colorKey: true,
      kind: true,
      activeUntil: true,
    },
  })

  return c.json({ perMonth, cumulative, staff })
})

// ── Audit ──

export const auditRoutes = new Hono<AuthEnv>()
auditRoutes.use('*', requireAuth)

auditRoutes.get('/', async (c) => {
  const entity = c.req.query('entity')
  const entityId = c.req.query('entityId')
  const take = Math.min(Number(c.req.query('take') ?? 100), 500)
  return c.json(
    await db.auditLog.findMany({
      where: {
        ...(entity ? { entity } : {}),
        ...(entityId ? { entityId } : {}),
      },
      include: { user: { select: { displayName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    }),
  )
})
