// SHO generator acceptance tests (docs/05 generatorAcceptanceTests).
import { describe, expect, it } from 'vitest'
import { generateConsultantRoster } from './generator/consultant'
import { generateShoRoster } from './generator/sho'
import { tallySho } from './fairness'
import { validateRoster } from './validation'
import { addDays, dayOfWeek, weekendPairs } from './dates'

const consultantPool = ['R', 'G', 'Pu', 'D'].map((id) => ({ id }))
const shoPool = [
  { id: 'S', activeFrom: '2026-01-01', activeUntil: null },
  { id: 'R', activeFrom: '2026-01-01', activeUntil: null },
  { id: 'M', activeFrom: '2026-01-01', activeUntil: null },
  { id: 'U', activeFrom: '2026-06-01', activeUntil: null },
]
const rotationOrder = ['R', 'M', 'S', 'U']

// July 2026 consultant roster (deterministic) supplies the Pu days.
const julyConsultant = generateConsultantRoster({
  month: '2026-07',
  consultants: consultantPool,
  previousTail: [
    { date: '2026-06-29', staffId: 'D' },
    { date: '2026-06-30', staffId: 'R' },
  ],
})
const julyPuDays = julyConsultant.assignments.filter((a) => a.staffId === 'Pu').map((a) => a.date)

// June fixture tail: 29 = U (post-cash), 30 = R
const juneTail = [
  { date: '2026-06-29', staffId: 'U', isCash: false },
  { date: '2026-06-30', staffId: 'R', isCash: false },
]

describe('SHO generator — July 2026', () => {
  const result = generateShoRoster({
    month: '2026-07',
    pool: shoPool,
    puDays: julyPuDays,
    previousTail: juneTail,
    rotationOrder,
    lastNonCashWeekendId: 'U', // June's last non-cash weekend (20–21)
  })

  it('passes all validators with zero violations', () => {
    const violations = validateRoster(
      { layer: 'SHO', month: '2026-07', slots: result.assignments },
      { pool: shoPool, unavailable: [], puDays: julyPuDays, previousTail: juneTail },
    )
    expect(violations).toEqual([])
  })

  it('covers every day with exactly one person', () => {
    expect(result.assignments).toHaveLength(31)
    expect(new Set(result.assignments.map((a) => a.date)).size).toBe(31)
  })

  it('cash days exactly equal the consultant Pu days', () => {
    const cashDates = result.assignments.filter((a) => a.isCash).map((a) => a.date)
    expect(cashDates.sort()).toEqual([...julyPuDays].sort())
  })

  it('post-cash follows every cash run, by a different person', () => {
    for (const a of result.assignments) {
      if (!a.isCash) continue
      const next = result.assignments.find((x) => x.date === addDays(a.date, 1))
      if (!next) continue // month boundary
      if (next.isCash) continue // cash weekend continues
      expect(next.isPostCash, `${next.date} after cash ${a.date}`).toBe(true)
      expect(next.staffId, `${next.date} person`).not.toBe(a.staffId)
    }
  })

  it('continues the non-cash weekend rotation from U → R first', () => {
    const firstNonCash = weekendPairs('2026-07').find(
      (w) => !julyPuDays.includes(w.sat) && !julyPuDays.includes(w.sun),
    )
    if (firstNonCash) {
      const sat = result.assignments.find((a) => a.date === firstNonCash.sat)!
      expect(sat.staffId).toBe('R')
    }
  })

  it('balances on-calls within a spread of 1 (like the paper 8/8/7/7)', () => {
    const tally = tallySho(result.assignments)
    const counts = shoPool.map((p) => tally[p.id]?.onCalls ?? 0)
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
  })

  it('boundary: July 1 is not June 30’s person', () => {
    expect(result.assignments.find((a) => a.date === '2026-07-01')!.staffId).not.toBe('R')
  })

  it('is deterministic', () => {
    const again = generateShoRoster({
      month: '2026-07',
      pool: shoPool,
      puDays: julyPuDays,
      previousTail: juneTail,
      rotationOrder,
      lastNonCashWeekendId: 'U',
    })
    expect(again).toEqual(result)
  })
})

describe('SHO generator — month-boundary post-cash', () => {
  it('marks day 1 post-cash when the previous month ended on a cash day', () => {
    const result = generateShoRoster({
      month: '2026-07',
      pool: shoPool,
      puDays: julyPuDays,
      previousTail: [{ date: '2026-06-30', staffId: 'M', isCash: true }],
      rotationOrder,
      lastNonCashWeekendId: 'U',
    })
    const day1 = result.assignments.find((a) => a.date === '2026-07-01')!
    if (!day1.isCash) {
      expect(day1.isPostCash).toBe(true)
      expect(day1.staffId).not.toBe('M')
    }
  })
})

describe('SHO generator — pool churn', () => {
  it('handles a member leaving mid-month (active window respected)', () => {
    const churnPool = [
      ...shoPool.slice(0, 3),
      { id: 'U', activeFrom: '2026-06-01', activeUntil: '2026-07-15' },
    ]
    const result = generateShoRoster({
      month: '2026-07',
      pool: churnPool,
      puDays: julyPuDays,
      rotationOrder,
      lastNonCashWeekendId: 'U',
    })
    for (const a of result.assignments) {
      if (a.staffId === 'U') expect(a.date <= '2026-07-15', `U on ${a.date}`).toBe(true)
    }
    // weekends still single-person, days all covered
    expect(result.assignments).toHaveLength(31)
  })
})

describe('cash weekend split', () => {
  it('a weekend where both days are Pu days is covered by two different people', () => {
    // Fabricate a cash weekend by marking a full weekend as Pu days
    const w = weekendPairs('2026-07')[0]
    const puWithWeekend = [...new Set([...julyPuDays, w.sat, w.sun])]
    const result = generateShoRoster({
      month: '2026-07',
      pool: shoPool,
      puDays: puWithWeekend,
      rotationOrder,
      lastNonCashWeekendId: 'U',
    })
    const sat = result.assignments.find((a) => a.date === w.sat)!
    const sun = result.assignments.find((a) => a.date === w.sun)!
    expect(sat.isCash && sun.isCash).toBe(true)
    expect(sat.staffId).not.toBe(sun.staffId)
    // Monday after is post-cash
    const mon = result.assignments.find((a) => a.date === addDays(w.sun, 1))
    if (mon && !mon.isCash) expect(mon.isPostCash).toBe(true)
    expect(dayOfWeek(w.sat)).toBe(6)
  })
})
