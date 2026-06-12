// Loads the June 2026 rosters from docs/05-test-fixtures.json into the dev DB
// (both layers, PUBLISHED), then verifies the stored data reproduces the
// fixture's expectedTallies. Idempotent — deletes and recreates the two rosters.
// Run after seed.ts: npm run db:fixtures
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const fixtures = JSON.parse(
  readFileSync(fileURLToPath(new URL('../docs/05-test-fixtures.json', import.meta.url)), 'utf8'),
)

// All roster times are Asia/Colombo (+05:30); stored as real UTC instants.
const dayDate = (d: string) => new Date(`${d}T00:00:00.000Z`) // @db.Date column
const colombo = (d: string, hm: string) => new Date(`${d}T${hm}:00+05:30`)
const nextDay = (d: string) => {
  const t = new Date(`${d}T00:00:00.000Z`)
  t.setUTCDate(t.getUTCDate() + 1)
  return t.toISOString().slice(0, 10)
}

async function main() {
  const unit = await prisma.unit.findFirst({ where: { name: 'Prof Unit' } })
  if (!unit) throw new Error('Run `npx prisma db seed` first — Prof Unit not found')

  const staff = await prisma.staffMember.findMany({ where: { unitId: unit.id } })
  const consultantByCode = new Map(
    staff.filter((s) => s.kind === 'CONSULTANT').map((s) => [s.shortCode, s]),
  )
  const shoByCode = new Map(
    staff.filter((s) => s.kind === 'SHO' || s.kind === 'RHO').map((s) => [s.shortCode, s]),
  )

  // ── Consultant roster ──
  const cFix = fixtures.consultantRoster_2026_06
  const weekendDates = new Set<string>(
    cFix.weekendBlocks.flatMap((b: { dates: string[] }) => b.dates),
  )

  await prisma.roster.deleteMany({
    where: { unitId: unit.id, layer: 'CONSULTANT', month: cFix.month },
  })
  const consultantRoster = await prisma.roster.create({
    data: {
      unitId: unit.id,
      layer: 'CONSULTANT',
      month: cFix.month,
      status: 'PUBLISHED',
      version: 1,
      publishedAt: new Date(),
      slots: {
        create: Object.entries(cFix.assignments as Record<string, string>).map(([date, code]) => {
          const member = consultantByCode.get(code)
          if (!member) throw new Error(`Unknown consultant shortCode ${code}`)
          return {
            date: dayDate(date),
            staffId: member.id,
            startsAt: colombo(date, '08:00'),
            endsAt: colombo(nextDay(date), '08:00'), // 24h; weekend block = 2 chained slots
            isWeekendBlock: weekendDates.has(date),
          }
        }),
      },
    },
  })

  // ── SHO roster ──
  type ShoDay = { who: string; isCash?: boolean; isPostCash?: boolean }
  const sFix = fixtures.shoRoster_2026_06

  await prisma.roster.deleteMany({ where: { unitId: unit.id, layer: 'SHO', month: sFix.month } })
  const shoRoster = await prisma.roster.create({
    data: {
      unitId: unit.id,
      layer: 'SHO',
      month: sFix.month,
      status: 'PUBLISHED',
      version: 1,
      builtAgainstVersion: consultantRoster.version,
      publishedAt: new Date(),
      slots: {
        create: Object.entries(sFix.assignments as Record<string, ShoDay>).map(([date, a]) => {
          const member = shoByCode.get(a.who)
          if (!member) throw new Error(`Unknown SHO shortCode ${a.who}`)
          return {
            date: dayDate(date),
            staffId: member.id,
            startsAt: colombo(date, '08:00'),
            endsAt: colombo(nextDay(date), '16:00'), // on-call: 8am → next day 4pm (32h)
            isCash: a.isCash ?? false,
            isPostCash: a.isPostCash ?? false,
          }
        }),
      },
    },
  })

  // ── Verify against expectedTallies ──
  const failures: string[] = []
  const check = (
    label: string,
    actual: Record<string, number>,
    expected: Record<string, number>,
  ) => {
    for (const [code, n] of Object.entries(expected)) {
      if (actual[code] !== n)
        failures.push(`${label}: ${code} expected ${n}, got ${actual[code] ?? 0}`)
    }
  }

  const cSlots = await prisma.dutySlot.findMany({
    where: { rosterId: consultantRoster.id },
    include: { staff: true },
  })
  const tally = (slots: typeof cSlots, filter: (s: (typeof cSlots)[number]) => boolean) =>
    slots.filter(filter).reduce<Record<string, number>>((acc, s) => {
      acc[s.staff.shortCode] = (acc[s.staff.shortCode] ?? 0) + 1
      return acc
    }, {})

  check(
    'consultant totalDays',
    tally(cSlots, () => true),
    cFix.expectedTallies.totalDays,
  )
  // weekend blocks: 2 slots each → count Saturdays only
  check(
    'consultant weekendBlocks',
    tally(cSlots, (s) => s.isWeekendBlock && s.date.getUTCDay() === 6),
    cFix.expectedTallies.weekendBlocks,
  )

  const sSlots = await prisma.dutySlot.findMany({
    where: { rosterId: shoRoster.id },
    include: { staff: true },
  })
  check(
    'sho onCalls',
    tally(sSlots, () => true),
    sFix.expectedTallies.onCalls,
  )
  check(
    'sho cash',
    tally(sSlots, (s) => s.isCash),
    sFix.expectedTallies.cash,
  )
  check(
    'sho postCash',
    tally(sSlots, (s) => s.isPostCash),
    sFix.expectedTallies.postCash,
  )

  if (failures.length > 0) {
    console.error('FIXTURE VERIFICATION FAILED:')
    for (const f of failures) console.error(`  ✗ ${f}`)
    process.exit(1)
  }

  console.log('Fixtures loaded and verified:')
  console.log(`  ${cFix.month} CONSULTANT: ${cSlots.length} slots — tallies match`)
  console.log(`  ${sFix.month} SHO: ${sSlots.length} slots — tallies match`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
