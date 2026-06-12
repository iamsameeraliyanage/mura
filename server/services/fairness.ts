// Pure tally computation — the numbers the editors balance by hand today
// (the tally boxes on the paper sheets and the 6-month summary table).
import { addDays, dayOfWeek } from './dates'

export interface SlotLike {
  date: string // YYYY-MM-DD
  staffId: string
  isCash?: boolean
  isPostCash?: boolean
  isWeekendBlock?: boolean
}

export interface ConsultantTally {
  days: number
  weekendBlocks: number
}

export function tallyConsultant(slots: SlotLike[]): Record<string, ConsultantTally> {
  const out: Record<string, ConsultantTally> = {}
  const get = (id: string) => (out[id] ??= { days: 0, weekendBlocks: 0 })
  for (const s of slots) {
    get(s.staffId).days += 1
    // a weekend block = its Saturday (the Sunday belongs to the same block)
    if (s.isWeekendBlock && dayOfWeek(s.date) === 6) get(s.staffId).weekendBlocks += 1
  }
  return out
}

export interface ShoTally {
  onCalls: number
  cash: number
  postCash: number
  nonCashWeekends: number
}

export function tallySho(slots: SlotLike[]): Record<string, ShoTally> {
  const byDate = new Map(slots.map((s) => [s.date, s]))
  const out: Record<string, ShoTally> = {}
  const get = (id: string) => (out[id] ??= { onCalls: 0, cash: 0, postCash: 0, nonCashWeekends: 0 })
  for (const s of slots) {
    get(s.staffId).onCalls += 1 // a non-cash weekend counts as 2 on-calls — naturally, 2 slots
    if (s.isCash) get(s.staffId).cash += 1
    if (s.isPostCash) get(s.staffId).postCash += 1
    if (dayOfWeek(s.date) === 6 && !s.isCash) {
      const sun = byDate.get(addDays(s.date, 1))
      if (sun && sun.staffId === s.staffId && !sun.isCash) get(s.staffId).nonCashWeekends += 1
    }
  }
  return out
}

/** Merge tallies from multiple months (cumulative fairness across staff turnover). */
export function mergeTallies<T extends Record<string, number>>(
  tallies: Record<string, T>[],
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const t of tallies) {
    for (const [id, counts] of Object.entries(t)) {
      if (!out[id]) {
        out[id] = { ...counts }
      } else {
        for (const key of Object.keys(counts) as (keyof T)[]) {
          out[id][key] = (out[id][key] + counts[key]) as T[keyof T]
        }
      }
    }
  }
  return out
}
