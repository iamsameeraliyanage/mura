// SHO/RHO roster generator — pure function (docs/01 §4).
// One person per day = the on-call; cash/post-cash are flags. Cash days = the
// consultant roster's Pu days. Post-cash = the day after each maximal cash run,
// a DIFFERENT person. Non-cash weekends: one person both days, fixed rotation
// carried across months. Cash weekends: split between two people. On-call,
// cash and post-cash counts each balanced (cash/post-cash inversely compensate).
import { addDays, daysInMonth, weekendPairs } from '../dates'
import type { ShoTally } from '../fairness'

export interface ShoGenInput {
  month: string
  pool: { id: string; activeFrom: string; activeUntil: string | null }[]
  /** The published consultant roster's Pu days — become cash days. */
  puDays: string[]
  unavailable?: Record<string, string[]>
  /** Last days of the previous month (incl. isCash for the boundary post-cash). */
  previousTail?: { date: string; staffId: string; isCash?: boolean }[]
  cumulative?: Record<string, ShoTally>
  /** Non-cash weekend rotation: fixed order of staff ids… */
  rotationOrder: string[]
  /** …and who took the last non-cash weekend (previous month). */
  lastNonCashWeekendId: string | null
}

export interface ShoGenResult {
  assignments: { date: string; staffId: string; isCash: boolean; isPostCash: boolean }[]
}

export function generateShoRoster(input: ShoGenInput): ShoGenResult {
  const { month, pool } = input
  if (pool.length < 2) throw new Error('Need at least 2 pool members')

  const days = daysInMonth(month)
  const cash = new Set(input.puDays.filter((d) => d.startsWith(month)))
  const unavailable = new Map(
    Object.entries(input.unavailable ?? {}).map(([id, list]) => [id, new Set(list)]),
  )
  const tail = [...(input.previousTail ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const tailByDate = new Map(tail.map((t) => [t.date, t]))
  const cumulative = input.cumulative ?? {}
  const cum = (id: string): ShoTally =>
    cumulative[id] ?? { onCalls: 0, cash: 0, postCash: 0, nonCashWeekends: 0 }

  const isActive = (id: string, d: string) => {
    const m = pool.find((p) => p.id === id)
    return !!m && d >= m.activeFrom && (!m.activeUntil || d <= m.activeUntil)
  }
  const canWork = (id: string, d: string) => isActive(id, d) && !unavailable.get(id)?.has(d)

  // Post-cash: the day after each maximal run of cash days (incl. boundary).
  const postCash = new Set<string>()
  for (const d of days) {
    if (cash.has(d)) continue
    const prev = addDays(d, -1)
    const prevCash = cash.has(prev) || (tailByDate.get(prev)?.isCash ?? false)
    if (prevCash) postCash.add(d)
  }

  // Weekend classification.
  const pairs = weekendPairs(month)
  const nonCashWeekends = pairs.filter((w) => !cash.has(w.sat) && !cash.has(w.sun))
  const pairedDays = new Map<string, string>() // sat→sun and sun→sat for assigned pairs

  // ── Non-cash weekend rotation (carries across months) ──
  const rotation = input.rotationOrder.filter((id) => pool.some((p) => p.id === id))
  for (const p of pool) if (!rotation.includes(p.id)) rotation.push(p.id) // new joiners append
  let cursor =
    input.lastNonCashWeekendId && rotation.includes(input.lastNonCashWeekendId)
      ? (rotation.indexOf(input.lastNonCashWeekendId) + 1) % rotation.length
      : 0
  const weekendAssignment = new Map<string, string>() // date → staffId
  for (const w of nonCashWeekends) {
    let assigned: string | null = null
    for (let tries = 0; tries < rotation.length; tries++) {
      const candidate = rotation[(cursor + tries) % rotation.length]
      if (canWork(candidate, w.sat) && canWork(candidate, w.sun)) {
        assigned = candidate
        cursor = (cursor + tries + 1) % rotation.length
        break
      }
    }
    if (!assigned) throw new Error(`No one available for the weekend of ${w.sat}`)
    weekendAssignment.set(w.sat, assigned)
    weekendAssignment.set(w.sun, assigned)
    pairedDays.set(w.sat, w.sun)
    pairedDays.set(w.sun, w.sat)
  }

  // Balance fairness only among members active the WHOLE month — joiners and
  // leavers can't match full-month counts (their tallies start/stop mid-way).
  const monthStart = days[0]
  const monthEnd = days[days.length - 1]
  const fullMonthIds = pool
    .filter((p) => p.activeFrom <= monthStart && (!p.activeUntil || p.activeUntil >= monthEnd))
    .map((p) => p.id)

  // ── Daily fill with seeded restarts ──
  const rng = lcg(hashSeed(`sho-${month}`))
  for (let attempt = 0; attempt < 600; attempt++) {
    const result = tryFill({
      days,
      cash,
      postCash,
      weekendAssignment,
      pool: pool.map((p) => p.id),
      fullMonthIds,
      canWork,
      tailByDate,
      cum,
      rng,
      strict: attempt < 400, // relax the cash/post-cash spread if struggling
    })
    if (result) return { assignments: result }
  }
  throw new Error('Could not generate a valid SHO roster after 600 attempts')
}

function tryFill(ctx: {
  days: string[]
  cash: Set<string>
  postCash: Set<string>
  weekendAssignment: Map<string, string>
  pool: string[]
  fullMonthIds: string[]
  canWork: (id: string, d: string) => boolean
  tailByDate: Map<string, { date: string; staffId: string; isCash?: boolean }>
  cum: (id: string) => ShoTally
  rng: () => number
  strict: boolean
}): { date: string; staffId: string; isCash: boolean; isPostCash: boolean }[] | null {
  const assigned = new Map<string, string>(ctx.weekendAssignment)
  const onCalls = new Map(ctx.pool.map((id) => [id, 0]))
  const cashCount = new Map(ctx.pool.map((id) => [id, 0]))
  const postCashCount = new Map(ctx.pool.map((id) => [id, 0]))

  for (const [date, id] of ctx.weekendAssignment) {
    onCalls.set(id, (onCalls.get(id) ?? 0) + 1)
    if (ctx.postCash.has(date)) postCashCount.set(id, (postCashCount.get(id) ?? 0) + 1)
  }

  const personOn = (d: string) => assigned.get(d) ?? ctx.tailByDate.get(d)?.staffId

  for (const date of ctx.days) {
    if (assigned.has(date)) continue
    const isCashDay = ctx.cash.has(date)
    const isPostCashDay = ctx.postCash.has(date)

    const candidates = ctx.pool.filter((id) => {
      if (!ctx.canWork(id, date)) return false
      if (personOn(addDays(date, -1)) === id) return false // V2 + V5 person rule
      if (assigned.get(addDays(date, 1)) === id) return false
      return true
    })
    if (candidates.length === 0) return null

    shuffle(candidates, ctx.rng)
    const score = (id: string): number => {
      const c = ctx.cum(id)
      if (isCashDay) {
        // primary: fewest cash; secondary: inverse compensation (more post-cash
        // earned → more cash); tertiary: fewest on-calls
        return (
          (cashCount.get(id)! + c.cash) * 100 -
          (postCashCount.get(id)! + c.postCash) * 10 +
          (onCalls.get(id)! + c.onCalls)
        )
      }
      if (isPostCashDay) {
        return (
          (postCashCount.get(id)! + c.postCash) * 100 -
          (cashCount.get(id)! + c.cash) * 10 +
          (onCalls.get(id)! + c.onCalls)
        )
      }
      return (onCalls.get(id)! + c.onCalls) * 100
    }
    candidates.sort((a, b) => score(a) - score(b))

    const pick = candidates[0]
    assigned.set(date, pick)
    onCalls.set(pick, onCalls.get(pick)! + 1)
    if (isCashDay) cashCount.set(pick, cashCount.get(pick)! + 1)
    if (isPostCashDay) postCashCount.set(pick, postCashCount.get(pick)! + 1)
  }

  // Balance acceptance: on-call spread ≤ 1 (like the paper sheets: 8/8/7/7);
  // cash and post-cash spreads ≤ 1 in strict mode, ≤ 2 when relaxed. Only
  // full-month members are compared — partial members can't match.
  if (ctx.fullMonthIds.length >= 2) {
    const spread = (m: Map<string, number>) => {
      const values = ctx.fullMonthIds.map((id) => m.get(id) ?? 0)
      return Math.max(...values) - Math.min(...values)
    }
    if (spread(onCalls) > 1) return null
    const flagLimit = ctx.strict ? 1 : 2
    if (spread(cashCount) > flagLimit || spread(postCashCount) > flagLimit) return null
  }

  return ctx.days
    .filter((d) => assigned.has(d))
    .map((date) => ({
      date,
      staffId: assigned.get(date)!,
      isCash: ctx.cash.has(date),
      isPostCash: ctx.postCash.has(date),
    }))
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
