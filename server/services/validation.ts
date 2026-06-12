// Pure rule checks V1–V9 (listed in prisma/schema.prisma). Input is plain
// data; output is a list of violations for the validation drawer.
import { addDays, dayOfWeek, daysInMonth, weekendPairs } from './dates'
import type { SlotLike } from './fairness'

export type RuleId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8'

export interface Violation {
  rule: RuleId
  message: string
  date?: string
  staffId?: string
}

export interface RosterData {
  layer: 'CONSULTANT' | 'SHO'
  month: string
  slots: SlotLike[]
}

export interface ValidationContext {
  pool: { id: string; activeFrom: string; activeUntil: string | null }[]
  unavailable: { staffId: string; from: string; to: string }[]
  /** SHO layer: the published consultant roster's Pu days. */
  puDays?: string[]
  /** Last days of the previous month's roster (V9 boundary checks). Omit if unknown. */
  previousTail?: { date: string; staffId: string; isCash?: boolean }[]
}

export function validateRoster(roster: RosterData, ctx: ValidationContext): Violation[] {
  const violations: Violation[] = []
  const days = daysInMonth(roster.month)
  const byDate = new Map(roster.slots.map((s) => [s.date, s]))
  const tail = [...(ctx.previousTail ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const lastTail = tail.at(-1)

  // V1 — every day has exactly one slot
  for (const d of days) {
    if (!byDate.has(d)) violations.push({ rule: 'V1', date: d, message: `${d} is unassigned` })
  }
  const seen = new Set<string>()
  for (const s of roster.slots) {
    if (seen.has(s.date))
      violations.push({ rule: 'V1', date: s.date, message: `${s.date} has multiple slots` })
    seen.add(s.date)
  }

  // V2 — no back-to-back days for the same person, except inside a consultant
  // weekend block or an SHO non-cash weekend pair. Includes the month boundary.
  const prevOf = (d: string): SlotLike | undefined => {
    const p = addDays(d, -1)
    return byDate.get(p) ?? (lastTail?.date === p ? lastTail : undefined)
  }
  for (const s of roster.slots) {
    const prev = prevOf(s.date)
    if (!prev || prev.staffId !== s.staffId) continue
    const consultantBlock = roster.layer === 'CONSULTANT' && s.isWeekendBlock && prev.isWeekendBlock
    const nonCashWeekendPair =
      roster.layer === 'SHO' && dayOfWeek(s.date) === 0 && !s.isCash && !(prev as SlotLike).isCash
    if (!consultantBlock && !nonCashWeekendPair) {
      violations.push({
        rule: 'V2',
        date: s.date,
        staffId: s.staffId,
        message: `${s.date}: back-to-back duty for the same person`,
      })
    }
  }

  if (roster.layer === 'CONSULTANT') {
    validateConsultant(roster, ctx, byDate, violations)
  } else {
    validateSho(roster, ctx, byDate, violations)
  }

  // V7 — no assignment on an unavailable date
  for (const s of roster.slots) {
    for (const u of ctx.unavailable) {
      if (u.staffId === s.staffId && s.date >= u.from && s.date <= u.to) {
        violations.push({
          rule: 'V7',
          date: s.date,
          staffId: s.staffId,
          message: `${s.date}: assigned while marked unavailable`,
        })
      }
    }
  }

  // V8 — assignments only inside the staff active window
  const poolById = new Map(ctx.pool.map((p) => [p.id, p]))
  for (const s of roster.slots) {
    const member = poolById.get(s.staffId)
    if (!member) {
      violations.push({
        rule: 'V8',
        date: s.date,
        staffId: s.staffId,
        message: `${s.date}: assignee is not in this roster's pool`,
      })
      continue
    }
    if (s.date < member.activeFrom || (member.activeUntil && s.date > member.activeUntil)) {
      violations.push({
        rule: 'V8',
        date: s.date,
        staffId: s.staffId,
        message: `${s.date}: assignee not active on this date`,
      })
    }
  }

  return violations
}

function validateConsultant(
  roster: RosterData,
  ctx: ValidationContext,
  byDate: Map<string, SlotLike>,
  violations: Violation[],
) {
  // V3 — exactly one weekend block each when the month's 4 weekends are all
  // assigned; with a 5th weekend someone legitimately has 2 (editor decision).
  const pairs = weekendPairs(roster.month)
  const assignedPairs = pairs.filter(
    (w) => byDate.get(w.sat)?.isWeekendBlock && byDate.get(w.sun)?.isWeekendBlock,
  )
  for (const w of assignedPairs) {
    const sat = byDate.get(w.sat)!
    const sun = byDate.get(w.sun)!
    if (sat.staffId !== sun.staffId) {
      violations.push({
        rule: 'V3',
        date: w.sat,
        message: `${w.sat}/${w.sun}: weekend block split between two consultants`,
      })
    }
  }
  if (pairs.length === 4 && assignedPairs.length === 4) {
    const counts = new Map<string, number>()
    for (const w of assignedPairs) {
      const id = byDate.get(w.sat)!.staffId
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    for (const p of ctx.pool) {
      const n = counts.get(p.id) ?? 0
      if (n !== 1) {
        violations.push({
          rule: 'V3',
          staffId: p.id,
          message: `consultant has ${n} weekend blocks this month (expected 1)`,
        })
      }
    }
  }
}

function validateSho(
  roster: RosterData,
  ctx: ValidationContext,
  byDate: Map<string, SlotLike>,
  violations: Violation[],
) {
  const days = daysInMonth(roster.month)

  // V4 — cash days must equal the consultant roster's Pu days
  if (ctx.puDays) {
    const pu = new Set(ctx.puDays)
    for (const s of roster.slots) {
      if (s.isCash && !pu.has(s.date)) {
        violations.push({
          rule: 'V4',
          date: s.date,
          message: `${s.date}: marked cash but Pu is not on consultant casualty`,
        })
      }
    }
    for (const d of pu) {
      const slot = byDate.get(d)
      if (slot && !slot.isCash) {
        violations.push({
          rule: 'V4',
          date: d,
          message: `${d}: Pu consultant casualty day but not marked cash`,
        })
      }
    }
  }

  // V5 — post-cash placement: the day after each maximal run of cash days is
  // post-cash, by a different person than the cash day before it.
  const tail = [...(ctx.previousTail ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const lastTail = tail.at(-1)
  const isCashOn = (d: string): boolean | undefined => {
    const slot = byDate.get(d)
    if (slot) return slot.isCash ?? false
    if (lastTail?.date === d) return lastTail.isCash ?? false
    return undefined // outside what we know (e.g. day 0 with no tail)
  }
  for (const d of days) {
    const slot = byDate.get(d)
    if (!slot) continue
    const prevDate = addDays(d, -1)
    const prevCash = isCashOn(prevDate)
    const expected = prevCash === true && !slot.isCash
    if (expected && !slot.isPostCash) {
      violations.push({
        rule: 'V5',
        date: d,
        message: `${d}: day after a cash day must be post-cash`,
      })
    }
    if (slot.isPostCash && prevCash === false) {
      violations.push({
        rule: 'V5',
        date: d,
        message: `${d}: marked post-cash but the previous day was not cash`,
      })
    }
    if (slot.isPostCash) {
      const prevSlot = byDate.get(prevDate) ?? (lastTail?.date === prevDate ? lastTail : undefined)
      if (prevSlot && prevSlot.staffId === slot.staffId) {
        violations.push({
          rule: 'V5',
          date: d,
          staffId: slot.staffId,
          message: `${d}: post-cash person must differ from the previous day's cash person`,
        })
      }
    }
  }

  // V6 — weekend shape: cash weekend split between two people (Monday after is
  // post-cash, covered by V5); non-cash weekend covered by ONE person.
  for (const w of weekendPairs(roster.month)) {
    const sat = byDate.get(w.sat)
    const sun = byDate.get(w.sun)
    if (!sat || !sun) continue
    if (sat.isCash && sun.isCash) {
      if (sat.staffId === sun.staffId) {
        violations.push({
          rule: 'V6',
          date: w.sat,
          message: `${w.sat}/${w.sun}: cash weekend must be split between two different people`,
        })
      }
    } else if (!sat.isCash && !sun.isCash) {
      if (sat.staffId !== sun.staffId) {
        violations.push({
          rule: 'V6',
          date: w.sat,
          message: `${w.sat}/${w.sun}: non-cash weekend must be covered by one person`,
        })
      }
    }
  }
}
