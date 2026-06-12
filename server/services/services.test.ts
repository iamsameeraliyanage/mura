// Acceptance tests against the REAL June 2026 paper rosters (docs/05).
// Pure-function land: staff shortCodes double as ids.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { mergeTallies, tallyConsultant, tallySho, type SlotLike } from './fairness'
import { validateRoster, type ValidationContext } from './validation'
import { generateConsultantRoster } from './generator/consultant'

const fixtures = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../docs/05-test-fixtures.json', import.meta.url)), 'utf8'),
)

// ── fixture → slot helpers ──

const cFix = fixtures.consultantRoster_2026_06
const sFix = fixtures.shoRoster_2026_06

const weekendDates = new Set<string>(
  cFix.weekendBlocks.flatMap((b: { dates: string[] }) => b.dates),
)

const consultantSlots: SlotLike[] = Object.entries(cFix.assignments as Record<string, string>).map(
  ([date, code]) => ({ date, staffId: code, isWeekendBlock: weekendDates.has(date) }),
)

const shoSlots: SlotLike[] = Object.entries(
  sFix.assignments as Record<string, { who: string; isCash?: boolean; isPostCash?: boolean }>,
).map(([date, a]) => ({
  date,
  staffId: a.who,
  isCash: a.isCash ?? false,
  isPostCash: a.isPostCash ?? false,
}))

const consultantPool = ['R', 'G', 'Pu', 'D'].map((id) => ({
  id,
  activeFrom: '2025-12-01',
  activeUntil: null,
}))
const shoPool = [
  { id: 'S', activeFrom: '2026-01-01', activeUntil: null },
  { id: 'R', activeFrom: '2026-01-01', activeUntil: null },
  { id: 'M', activeFrom: '2026-01-01', activeUntil: null },
  { id: 'U', activeFrom: '2026-06-01', activeUntil: null },
]

const puDays = Object.entries(cFix.assignments as Record<string, string>)
  .filter(([, code]) => code === 'Pu')
  .map(([date]) => date)

// ── fairness ──

describe('fairness tallies', () => {
  it('reproduces the June consultant tally box', () => {
    const tally = tallyConsultant(consultantSlots)
    for (const [code, days] of Object.entries(cFix.expectedTallies.totalDays)) {
      expect(tally[code].days, code).toBe(days)
    }
    for (const [code, blocks] of Object.entries(cFix.expectedTallies.weekendBlocks)) {
      expect(tally[code].weekendBlocks, code).toBe(blocks)
    }
  })

  it('reproduces the June SHO tally box', () => {
    const tally = tallySho(shoSlots)
    for (const [code, n] of Object.entries(sFix.expectedTallies.onCalls)) {
      expect(tally[code].onCalls, `${code} onCalls`).toBe(n)
    }
    for (const [code, n] of Object.entries(sFix.expectedTallies.cash)) {
      expect(tally[code].cash, `${code} cash`).toBe(n)
    }
    for (const [code, n] of Object.entries(sFix.expectedTallies.postCash)) {
      expect(tally[code].postCash, `${code} postCash`).toBe(n)
    }
  })

  it('merges tallies across months', () => {
    const a = { R: { days: 8, weekendBlocks: 1 } }
    const b = { R: { days: 7, weekendBlocks: 1 }, G: { days: 8, weekendBlocks: 1 } }
    expect(mergeTallies([a, b])).toEqual({
      R: { days: 15, weekendBlocks: 2 },
      G: { days: 8, weekendBlocks: 1 },
    })
  })
})

// ── validators on the gold-standard month ──

describe('validators on June 2026 fixtures', () => {
  it('consultant roster has zero violations', () => {
    const violations = validateRoster(
      { layer: 'CONSULTANT', month: '2026-06', slots: consultantSlots },
      {
        pool: consultantPool,
        unavailable: [],
        previousTail: [{ date: '2026-05-31', staffId: 'Pu' }],
      },
    )
    expect(violations).toEqual([])
  })

  it('SHO roster has zero violations', () => {
    const violations = validateRoster(
      { layer: 'SHO', month: '2026-06', slots: shoSlots },
      { pool: shoPool, unavailable: [], puDays },
    )
    expect(violations).toEqual([])
  })

  it('catches a post-cash same-person violation when introduced', () => {
    // June 4 (post-cash) deliberately reassigned to June 3's cash person (S)
    const broken = shoSlots.map((s) => (s.date === '2026-06-04' ? { ...s, staffId: 'S' } : s))
    const violations = validateRoster(
      { layer: 'SHO', month: '2026-06', slots: broken },
      { pool: shoPool, unavailable: [], puDays },
    )
    expect(violations.some((v) => v.rule === 'V5' && v.date === '2026-06-04')).toBe(true)
    expect(violations.some((v) => v.rule === 'V2' && v.date === '2026-06-04')).toBe(true)
  })
})

// ── consultant generator ──

const validate = (
  month: string,
  result: ReturnType<typeof generateConsultantRoster>,
  ctx: Partial<ValidationContext> = {},
) =>
  validateRoster(
    { layer: 'CONSULTANT', month, slots: result.assignments },
    { pool: consultantPool, unavailable: [], ...ctx },
  )

describe('consultant generator', () => {
  it('July 2026 (4 weekends): valid, fair, no boundary back-to-back', () => {
    const result = generateConsultantRoster({
      month: '2026-07',
      consultants: consultantPool,
      previousTail: [
        { date: '2026-06-28', staffId: 'Pu' },
        { date: '2026-06-29', staffId: 'D' },
        { date: '2026-06-30', staffId: 'R' },
      ],
      cumulative: tallyConsultant(consultantSlots),
    })

    expect(result.needsDecision).toBeNull()
    expect(result.assignments).toHaveLength(31)
    expect(
      validate('2026-07', result, {
        previousTail: [{ date: '2026-06-30', staffId: 'R' }],
      }),
    ).toEqual([])

    const tally = tallyConsultant(result.assignments)
    for (const c of consultantPool) {
      expect(tally[c.id].days, `${c.id} days`).toBeGreaterThanOrEqual(7)
      expect(tally[c.id].days, `${c.id} days`).toBeLessThanOrEqual(8)
      expect(tally[c.id].weekendBlocks, `${c.id} weekends`).toBe(1)
    }
    // R worked June 30 → must not work July 1
    expect(result.assignments.find((a) => a.date === '2026-07-01')!.staffId).not.toBe('R')
  })

  it('August 2026 (5 weekends): assigns 4 blocks, flags the 5th', () => {
    const result = generateConsultantRoster({ month: '2026-08', consultants: consultantPool })

    expect(result.needsDecision).toEqual({ sat: '2026-08-29', sun: '2026-08-30' })
    expect(result.assignments).toHaveLength(29) // 31 minus the needs-decision pair

    const violations = validate('2026-08', result)
    // only the two intentionally-unassigned days may appear, as V1
    expect(violations.every((v) => v.rule === 'V1')).toBe(true)
    expect(violations.map((v) => v.date).sort()).toEqual(['2026-08-29', '2026-08-30'])

    const tally = tallyConsultant(result.assignments)
    for (const c of consultantPool) expect(tally[c.id].weekendBlocks).toBe(1)
  })

  it('respects unavailability', () => {
    const result = generateConsultantRoster({
      month: '2026-07',
      consultants: consultantPool,
      unavailable: {
        G: ['2026-07-10', '2026-07-11', '2026-07-12', '2026-07-13', '2026-07-14', '2026-07-15'],
      },
    })
    for (const a of result.assignments) {
      if (a.staffId === 'G') {
        expect(a.date < '2026-07-10' || a.date > '2026-07-15', `G on ${a.date}`).toBe(true)
      }
    }
    expect(
      validate('2026-07', result, {
        unavailable: [{ staffId: 'G', from: '2026-07-10', to: '2026-07-15' }],
      }),
    ).toEqual([])
  })

  it('is deterministic for the same inputs', () => {
    const a = generateConsultantRoster({ month: '2026-09', consultants: consultantPool })
    const b = generateConsultantRoster({ month: '2026-09', consultants: consultantPool })
    expect(a).toEqual(b)
  })
})
