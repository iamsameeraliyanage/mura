// Consultant casualty roster generator — pure function (docs/01 §3).
// Rules: 7–8 days each per month, exactly 1 weekend block each (4 weekends),
// no back-to-back days (except inside one's own weekend block), prefer 2–3 day
// gaps, respect unavailability and the previous month's tail, leave a 5th
// weekend unassigned ("needs decision"). Deterministic: seeded RNG + restarts.
import { addDays, daysInMonth, weekendPairs } from '../dates'

export interface ConsultantGenInput {
  month: string // YYYY-MM
  consultants: { id: string }[]
  /** staffId → unavailable dates (YYYY-MM-DD) */
  unavailable?: Record<string, string[]>
  /** Last few days of the previous month: [{date, staffId}] */
  previousTail?: { date: string; staffId: string }[]
  /** Cumulative fairness from prior months — biases who gets the extra day. */
  cumulative?: Record<string, { days: number; weekendBlocks: number }>
}

export interface ConsultantGenResult {
  assignments: { date: string; staffId: string; isWeekendBlock: boolean }[]
  /** 5-weekend months: this pair is left for the editor to decide. */
  needsDecision: { sat: string; sun: string } | null
}

export function generateConsultantRoster(input: ConsultantGenInput): ConsultantGenResult {
  const { month, consultants } = input
  if (consultants.length < 2) throw new Error('Need at least 2 consultants')

  const unavailable = new Map(
    Object.entries(input.unavailable ?? {}).map(([id, dates]) => [id, new Set(dates)]),
  )
  const isUnavailable = (id: string, d: string) => unavailable.get(id)?.has(d) ?? false
  const cumulative = input.cumulative ?? {}
  const cum = (id: string) => cumulative[id] ?? { days: 0, weekendBlocks: 0 }

  const tail = [...(input.previousTail ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const lastTailByDate = new Map(tail.map((t) => [t.date, t.staffId]))

  const allDays = daysInMonth(month)
  const pairs = weekendPairs(month)
  const needsDecision = pairs.length > consultants.length ? pairs[pairs.length - 1] : null
  const assignablePairs = needsDecision ? pairs.slice(0, -1) : pairs
  const decisionDays = new Set(needsDecision ? [needsDecision.sat, needsDecision.sun] : [])

  // ── Weekend blocks: one per consultant, ordered by cumulative weekend count ──
  // Try orderings until none clashes with unavailability or the month boundary.
  const weekendOrder = [...consultants].sort(
    (a, b) => cum(a.id).weekendBlocks - cum(b.id).weekendBlocks || a.id.localeCompare(b.id),
  )
  const weekendAssign = assignWeekends(
    assignablePairs,
    weekendOrder.map((c) => c.id),
    isUnavailable,
    lastTailByDate,
  )
  if (!weekendAssign) throw new Error('Could not assign weekend blocks (check unavailability)')

  // ── Day quotas: total days split evenly; fewer cumulative days → the extra ──
  const assignableDayCount = allDays.length - decisionDays.size
  const base = Math.floor(assignableDayCount / consultants.length)
  const extras = assignableDayCount % consultants.length
  const quotaOrder = [...consultants].sort(
    (a, b) => cum(a.id).days - cum(b.id).days || a.id.localeCompare(b.id),
  )
  const quota = new Map<string, number>(
    quotaOrder.map((c, i) => [c.id, base + (i < extras ? 1 : 0)]),
  )

  // ── Weekday fill: seeded greedy with restarts ──
  const rng = lcg(hashSeed(month))
  for (let attempt = 0; attempt < 500; attempt++) {
    const result = tryFill({
      allDays,
      decisionDays,
      weekendAssign,
      quota,
      consultants: consultants.map((c) => c.id),
      isUnavailable,
      lastTailByDate,
      rng,
    })
    if (result) return { assignments: result, needsDecision }
  }
  throw new Error('Could not generate a valid roster after 500 attempts')
}

function assignWeekends(
  pairs: { sat: string; sun: string }[],
  orderedIds: string[],
  isUnavailable: (id: string, d: string) => boolean,
  tail: Map<string, string>,
): Map<string, string> | null {
  // pairs.length ≤ consultants. Try rotations of the fairness ordering first,
  // then full permutations (n is 4 — trivial).
  const candidates: string[][] = []
  for (let r = 0; r < orderedIds.length; r++) {
    candidates.push([...orderedIds.slice(r), ...orderedIds.slice(0, r)])
  }
  candidates.push(...permutations(orderedIds))

  for (const order of candidates) {
    const map = new Map<string, string>() // sat → staffId
    let ok = true
    for (let i = 0; i < pairs.length; i++) {
      const id = order[i]
      const { sat, sun } = pairs[i]
      if (isUnavailable(id, sat) || isUnavailable(id, sun)) {
        ok = false
        break
      }
      // boundary: consultant on the last day of the previous month can't take
      // a weekend starting the 1st
      if (tail.get(addDays(sat, -1)) === id) {
        ok = false
        break
      }
      map.set(sat, id)
    }
    if (ok) return map
  }
  return null
}

function tryFill(ctx: {
  allDays: string[]
  decisionDays: Set<string>
  weekendAssign: Map<string, string> // sat → staffId
  quota: Map<string, number>
  consultants: string[]
  isUnavailable: (id: string, d: string) => boolean
  lastTailByDate: Map<string, string>
  rng: () => number
}): { date: string; staffId: string; isWeekendBlock: boolean }[] | null {
  const assigned = new Map<string, string>() // date → staffId
  const remaining = new Map(ctx.quota)
  const lastDuty = new Map<string, string>() // staffId → last assigned date

  for (const [date, staffId] of ctx.lastTailByDate) {
    const prev = lastDuty.get(staffId)
    if (!prev || date > prev) lastDuty.set(staffId, date)
  }

  // Place weekend blocks first (they're fixed).
  const weekendDays = new Set<string>()
  for (const [sat, staffId] of ctx.weekendAssign) {
    const sun = addDays(sat, 1)
    assigned.set(sat, staffId)
    assigned.set(sun, staffId)
    weekendDays.add(sat)
    weekendDays.add(sun)
    remaining.set(staffId, (remaining.get(staffId) ?? 0) - 2)
  }

  const personOn = (d: string) => assigned.get(d) ?? ctx.lastTailByDate.get(d)

  for (const date of ctx.allDays) {
    if (assigned.has(date) || ctx.decisionDays.has(date)) continue

    const candidates = ctx.consultants.filter((id) => {
      if ((remaining.get(id) ?? 0) <= 0) return false
      if (ctx.isUnavailable(id, date)) return false
      if (personOn(addDays(date, -1)) === id) return false // no back-to-back
      if (assigned.get(addDays(date, 1)) === id) return false // next day already theirs (weekend)
      return true
    })
    if (candidates.length === 0) return null

    // Score: most remaining quota first, then longest rest since last duty,
    // with a seeded shuffle for tie-breaking variety across restarts.
    const gapOf = (id: string) => {
      const last = lastDuty.get(id)
      return last ? daysBetween(last, date) : 99
    }
    shuffle(candidates, ctx.rng)
    candidates.sort((a, b) => {
      const quotaDiff = (remaining.get(b) ?? 0) - (remaining.get(a) ?? 0)
      if (quotaDiff !== 0) return quotaDiff
      return gapOf(b) - gapOf(a) // prefer the better-rested (2–3 day gap rule)
    })

    const pick = candidates[0]
    // Soft minimum gap: if the best pick rested < 2 days and another candidate
    // rested ≥ 2, prefer them (keeps the "2–3 day gap" feel of the real sheets).
    const rested = candidates.find((id) => gapOf(id) >= 3)
    const chosen = gapOf(pick) < 3 && rested ? rested : pick

    assigned.set(date, chosen)
    remaining.set(chosen, (remaining.get(chosen) ?? 0) - 1)
    lastDuty.set(chosen, date)
  }

  if ([...remaining.values()].some((n) => n !== 0)) return null

  return ctx.allDays
    .filter((d) => assigned.has(d))
    .map((date) => ({
      date,
      staffId: assigned.get(date)!,
      isWeekendBlock: weekendDays.has(date),
    }))
}

// ── small pure utilities ──

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  )
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function lcg(seed: number): () => number {
  let state = seed || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function shuffle<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
