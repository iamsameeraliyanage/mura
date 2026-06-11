// DB ↔ pure-service glue: loads generator/validator inputs and converts
// DutySlot rows to the plain date-string shapes the pure functions use.
import type { DutySlot, Roster, RosterLayer, StaffKind, StaffMember } from '@prisma/client'
import { db } from '../db'
import { previousMonth } from './dates'
import type { SlotLike } from './fairness'
import type { ValidationContext } from './validation'

// Sri Lanka has a single, DST-free timezone (docs/02) — a fixed offset is safe.
const TZ_OFFSET = '+05:30'

export const toDateString = (d: Date): string => d.toISOString().slice(0, 10)

export const colomboInstant = (date: string, hm: string): Date =>
  new Date(`${date}T${hm}:00${TZ_OFFSET}`)

export function slotToLike(slot: DutySlot): SlotLike {
  return {
    date: toDateString(slot.date),
    staffId: slot.staffId,
    isCash: slot.isCash,
    isPostCash: slot.isPostCash,
    isWeekendBlock: slot.isWeekendBlock,
  }
}

interface ShiftTimes {
  start: string // "08:00"
  endNextDay: string // "08:00" (consultant) / "16:00" (SHO)
}

/** Shift times from DutyConfig, falling back to the Pead defaults. */
export async function getShiftTimes(unitId: string, layer: RosterLayer): Promise<ShiftTimes> {
  const cfg = await db.dutyConfig.findUnique({ where: { unitId_layer: { unitId, layer } } })
  const config = (cfg?.config ?? {}) as Record<string, { start?: string; endNextDay?: string }>
  const block = layer === 'CONSULTANT' ? config.weekdayCasualty : config.onCall
  return {
    start: block?.start ?? '08:00',
    endNextDay: block?.endNextDay ?? (layer === 'CONSULTANT' ? '08:00' : '16:00'),
  }
}

/** The assignment pool for a unit+layer, active at any point in the month. */
export async function getPool(
  unitId: string,
  layer: RosterLayer,
  month: string,
): Promise<StaffMember[]> {
  const cfg = await db.dutyConfig.findUnique({ where: { unitId_layer: { unitId, layer } } })
  const poolKinds = (
    cfg?.poolKinds?.length
      ? cfg.poolKinds
      : layer === 'CONSULTANT'
        ? ['CONSULTANT']
        : ['SHO', 'RHO']
  ) as StaffKind[]
  const monthStart = `${month}-01`
  const monthEnd = `${month}-31`
  return db.staffMember.findMany({
    where: {
      unitId,
      kind: { in: poolKinds },
      activeFrom: { lte: new Date(`${monthEnd}T00:00:00Z`) },
      OR: [{ activeUntil: null }, { activeUntil: { gte: new Date(`${monthStart}T00:00:00Z`) } }],
    },
    orderBy: { createdAt: 'asc' },
  })
}

/** Last 3 assigned days of the previous month's roster (V9 boundary checks). */
export async function getPreviousTail(
  unitId: string,
  layer: RosterLayer,
  month: string,
): Promise<{ date: string; staffId: string; isCash?: boolean }[]> {
  const roster = await db.roster.findUnique({
    where: { unitId_layer_month: { unitId, layer, month: previousMonth(month) } },
    include: { slots: { orderBy: { date: 'desc' }, take: 3 } },
  })
  if (!roster) return []
  return roster.slots
    .map((s) => ({ date: toDateString(s.date), staffId: s.staffId, isCash: s.isCash }))
    .reverse()
}

/** The published consultant roster's Pu (seat) days for a month — cash days. */
export async function getPuDays(unitId: string, month: string): Promise<string[] | undefined> {
  const roster = await db.roster.findUnique({
    where: { unitId_layer_month: { unitId, layer: 'CONSULTANT', month } },
    include: { slots: { include: { staff: true } } },
  })
  if (!roster || roster.status !== 'PUBLISHED') return undefined
  return roster.slots.filter((s) => s.staff.isSeat).map((s) => toDateString(s.date))
}

export async function getValidationContext(
  roster: Roster & { slots: DutySlot[] },
): Promise<ValidationContext> {
  const pool = await getPool(roster.unitId, roster.layer, roster.month)
  const unavailable = await db.unavailabilityDate.findMany({
    where: { staff: { unitId: roster.unitId } },
  })
  return {
    pool: pool.map((p) => ({
      id: p.id,
      activeFrom: toDateString(p.activeFrom),
      activeUntil: p.activeUntil ? toDateString(p.activeUntil) : null,
    })),
    unavailable: unavailable.map((u) => ({
      staffId: u.staffId,
      from: toDateString(u.from),
      to: toDateString(u.to),
    })),
    puDays: roster.layer === 'SHO' ? await getPuDays(roster.unitId, roster.month) : undefined,
    previousTail: await getPreviousTail(roster.unitId, roster.layer, roster.month),
  }
}

/** Cumulative tallies input for the generator: all slots before this month. */
export async function getPriorSlots(
  unitId: string,
  layer: RosterLayer,
  month: string,
): Promise<SlotLike[]> {
  const rosters = await db.roster.findMany({
    where: { unitId, layer, month: { lt: month } },
    include: { slots: true },
  })
  return rosters.flatMap((r) => r.slots.map(slotToLike))
}
