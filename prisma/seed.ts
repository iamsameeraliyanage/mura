// Seeds the M1 baseline: admin user, Hospital → Paediatrics → Prof Unit,
// the 4 consultants + 4 SHO pool members (docs/05), DutyConfig with Pead
// defaults, and WeekendRotationState. Idempotent — safe to re-run.
// June 2026 rosters are loaded separately by load-fixtures.ts.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env')
  }

  // ── Org hierarchy ──
  const hospital =
    (await prisma.hospital.findFirst({ where: { name: 'Base Hospital' } })) ??
    (await prisma.hospital.create({ data: { name: 'Base Hospital' } }))

  const department = await prisma.department.upsert({
    where: { hospitalId_name: { hospitalId: hospital.id, name: 'Paediatrics' } },
    update: {},
    create: { hospitalId: hospital.id, name: 'Paediatrics' },
  })

  const unit = await prisma.unit.upsert({
    where: { departmentId_name: { departmentId: department.id, name: 'Prof Unit' } },
    update: {},
    create: { departmentId: department.id, name: 'Prof Unit' },
  })

  // ── Admin user ──
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      displayName: 'Admin',
      role: 'ADMIN',
    },
  })

  // ── Editor users (E1 = consultant roster, E2 = SHO roster; docs/01 §2) ──
  // Placeholder emails — update via the admin panel with real addresses.
  const editorPassword = await bcrypt.hash('mura-editor-2026', 10)
  await prisma.user.upsert({
    where: { email: 'wasana@mura.local' },
    update: {},
    create: {
      email: 'wasana@mura.local',
      passwordHash: editorPassword,
      displayName: 'Dr. Wasana',
      role: 'CONSULTANT_EDITOR',
      unitId: unit.id,
    },
  })
  await prisma.user.upsert({
    where: { email: 'ruwanda@mura.local' },
    update: {},
    create: {
      email: 'ruwanda@mura.local',
      passwordHash: editorPassword,
      displayName: 'Dr. Ruwanda',
      role: 'SHO_EDITOR',
      unitId: unit.id,
    },
  })

  // ── Staff (from docs/05-test-fixtures.json) ──
  // Consultants active since the data series begins (Dec 2025).
  const consultants = [
    { shortCode: 'R', fullName: 'Dr. Lal Rathnasiri', colorKey: 'pen-black' },
    { shortCode: 'G', fullName: 'Dr. Gihan', colorKey: 'pen-violet' },
    {
      shortCode: 'Pu',
      fullName: 'Prof Unit',
      colorKey: 'pen-green',
      isSeat: true,
      currentHolder: 'Dr. Kasun',
    },
    { shortCode: 'D', fullName: 'Dr. Dinesha', colorKey: 'pen-red' },
  ]

  const shoPool = [
    {
      shortCode: 'S',
      fullName: 'Sulakshana',
      kind: 'RHO',
      colorKey: 'pen-blue',
      activeFrom: '2026-01-01',
    },
    {
      shortCode: 'R',
      fullName: 'Ruwanda',
      kind: 'SHO',
      colorKey: 'pen-teal',
      activeFrom: '2026-01-01',
    },
    {
      shortCode: 'M',
      fullName: 'Mekala',
      kind: 'RHO',
      colorKey: 'pen-orange',
      activeFrom: '2026-01-01',
    },
    {
      shortCode: 'U',
      fullName: 'Udara',
      kind: 'SHO',
      colorKey: 'pen-pink',
      activeFrom: '2026-06-01',
    },
  ] as const

  for (const c of consultants) {
    const existing = await prisma.staffMember.findFirst({
      where: { unitId: unit.id, kind: 'CONSULTANT', fullName: c.fullName },
    })
    if (!existing) {
      await prisma.staffMember.create({
        data: {
          unitId: unit.id,
          kind: 'CONSULTANT',
          fullName: c.fullName,
          shortCode: c.shortCode,
          colorKey: c.colorKey,
          isSeat: c.isSeat ?? false,
          currentHolder: c.currentHolder,
          activeFrom: new Date('2025-12-01'),
        },
      })
    }
  }

  for (const s of shoPool) {
    const existing = await prisma.staffMember.findFirst({
      where: { unitId: unit.id, kind: s.kind, fullName: s.fullName },
    })
    if (!existing) {
      await prisma.staffMember.create({
        data: {
          unitId: unit.id,
          kind: s.kind,
          fullName: s.fullName,
          shortCode: s.shortCode,
          colorKey: s.colorKey,
          activeFrom: new Date(s.activeFrom),
        },
      })
    }
  }

  // ── DutyConfig: Pead defaults (docs/01 §3–4) ──
  await prisma.dutyConfig.upsert({
    where: { unitId_layer: { unitId: unit.id, layer: 'CONSULTANT' } },
    update: {},
    create: {
      unitId: unit.id,
      layer: 'CONSULTANT',
      poolKinds: ['CONSULTANT'],
      config: {
        timezone: 'Asia/Colombo',
        weekdayCasualty: { start: '08:00', endNextDay: '08:00' }, // 24h
        weekendBlock: { day: 'SAT', start: '08:00', endDay: 'MON', end: '08:00', onePerson: true }, // 48h
        targetDaysPerMonth: [7, 8],
        weekendBlocksPerMonth: 1,
        minGapDays: 2,
      },
    },
  })

  await prisma.dutyConfig.upsert({
    where: { unitId_layer: { unitId: unit.id, layer: 'SHO' } },
    update: {},
    create: {
      unitId: unit.id,
      layer: 'SHO',
      poolKinds: ['SHO', 'RHO'], // ONE combined pool in Pead
      config: {
        timezone: 'Asia/Colombo',
        onCall: { start: '08:00', endNextDay: '16:00' }, // 32h, incl. cash days
        dayDuty: { start: '08:00', end: '16:00' }, // post-cash, 2nd on-call
        nonCashWeekend: { onePersonBothDays: true, countsAsOnCalls: 2 },
        cashWeekend: { splitBetweenTwoPeople: true, mondayAfterIsPostCash: true },
      },
    },
  })

  // ── WeekendRotationState: non-cash weekend rotation R→M→S→U ──
  // June's last non-cash weekend (20–21) was Udara, so the cycle resumes at R.
  const pool = await prisma.staffMember.findMany({
    where: { unitId: unit.id, kind: { in: ['SHO', 'RHO'] } },
  })
  const byName = (n: string) => {
    const m = pool.find((p) => p.fullName === n)
    if (!m) throw new Error(`Seed staff missing: ${n}`)
    return m.id
  }
  await prisma.weekendRotationState.upsert({
    where: { unitId_layer: { unitId: unit.id, layer: 'SHO' } },
    update: {},
    create: {
      unitId: unit.id,
      layer: 'SHO',
      rotationOrder: [byName('Ruwanda'), byName('Mekala'), byName('Sulakshana'), byName('Udara')],
      lastAssignedId: byName('Udara'),
    },
  })

  console.log('Seed complete:')
  console.log(`  hospital=${hospital.name} dept=${department.name} unit=${unit.name}`)
  console.log(`  admin=${adminEmail}`)
  console.log(
    `  staff=${await prisma.staffMember.count()} dutyConfigs=${await prisma.dutyConfig.count()}`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
