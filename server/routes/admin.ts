// Admin-only CRUD: org hierarchy, staff, users, duty config (docs/02 §API).
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { zValidator } from '@hono/zod-validator'
import {
  departmentCreateSchema,
  departmentUpdateSchema,
  dutyConfigUpsertSchema,
  hospitalCreateSchema,
  hospitalUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  unitCreateSchema,
  unitUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
} from '../../shared/schemas'
import { db } from '../db'
import { writeAudit } from '../lib/audit'
import { requireAuth, requireRole, type AuthEnv } from '../middleware/auth'

export const adminRoutes = new Hono<AuthEnv>()

adminRoutes.use('*', requireAuth, requireRole('ADMIN'))

const day = (d: string) => new Date(`${d}T00:00:00.000Z`)

// ── Hospitals ──

adminRoutes.get('/hospitals', async (c) => {
  return c.json(
    await db.hospital.findMany({
      include: { departments: { include: { units: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  )
})

adminRoutes.post('/hospitals', zValidator('json', hospitalCreateSchema), async (c) => {
  const hospital = await db.hospital.create({ data: c.req.valid('json') })
  await writeAudit({
    userId: c.get('user').id,
    action: 'CREATE',
    entity: 'Hospital',
    entityId: hospital.id,
    after: hospital,
  })
  return c.json(hospital, 201)
})

adminRoutes.patch('/hospitals/:id', zValidator('json', hospitalUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const before = await db.hospital.findUnique({ where: { id } })
  if (!before) throw new HTTPException(404, { message: 'Hospital not found' })
  const after = await db.hospital.update({ where: { id }, data: c.req.valid('json') })
  await writeAudit({
    userId: c.get('user').id,
    action: 'UPDATE',
    entity: 'Hospital',
    entityId: id,
    before,
    after,
  })
  return c.json(after)
})

// ── Departments ──

adminRoutes.post('/departments', zValidator('json', departmentCreateSchema), async (c) => {
  const department = await db.department.create({ data: c.req.valid('json') })
  await writeAudit({
    userId: c.get('user').id,
    action: 'CREATE',
    entity: 'Department',
    entityId: department.id,
    after: department,
  })
  return c.json(department, 201)
})

adminRoutes.patch('/departments/:id', zValidator('json', departmentUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const before = await db.department.findUnique({ where: { id } })
  if (!before) throw new HTTPException(404, { message: 'Department not found' })
  const after = await db.department.update({ where: { id }, data: c.req.valid('json') })
  await writeAudit({
    userId: c.get('user').id,
    action: 'UPDATE',
    entity: 'Department',
    entityId: id,
    before,
    after,
  })
  return c.json(after)
})

// ── Units ──

adminRoutes.post('/units', zValidator('json', unitCreateSchema), async (c) => {
  const unit = await db.unit.create({ data: c.req.valid('json') })
  await writeAudit({
    userId: c.get('user').id,
    action: 'CREATE',
    entity: 'Unit',
    entityId: unit.id,
    after: unit,
  })
  return c.json(unit, 201)
})

adminRoutes.patch('/units/:id', zValidator('json', unitUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const before = await db.unit.findUnique({ where: { id } })
  if (!before) throw new HTTPException(404, { message: 'Unit not found' })
  const after = await db.unit.update({ where: { id }, data: c.req.valid('json') })
  await writeAudit({
    userId: c.get('user').id,
    action: 'UPDATE',
    entity: 'Unit',
    entityId: id,
    before,
    after,
  })
  return c.json(after)
})

// ── Staff (reads live in staff.ts, open to editors) ──

adminRoutes.post('/staff', zValidator('json', staffCreateSchema), async (c) => {
  const input = c.req.valid('json')
  const staff = await db.staffMember.create({
    data: {
      ...input,
      activeFrom: day(input.activeFrom),
      activeUntil: input.activeUntil ? day(input.activeUntil) : null,
    },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: 'CREATE',
    entity: 'StaffMember',
    entityId: staff.id,
    after: staff,
  })
  return c.json(staff, 201)
})

adminRoutes.patch('/staff/:id', zValidator('json', staffUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const input = c.req.valid('json')
  const before = await db.staffMember.findUnique({ where: { id } })
  if (!before) throw new HTTPException(404, { message: 'Staff member not found' })
  const after = await db.staffMember.update({
    where: { id },
    data: {
      ...input,
      activeFrom: input.activeFrom ? day(input.activeFrom) : undefined,
      activeUntil:
        input.activeUntil === undefined
          ? undefined
          : input.activeUntil
            ? day(input.activeUntil)
            : null,
    },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: 'UPDATE',
    entity: 'StaffMember',
    entityId: id,
    before,
    after,
  })
  return c.json(after)
})

// ── Users ──

adminRoutes.get('/users', async (c) => {
  const users = await db.user.findMany({
    select: { id: true, email: true, displayName: true, role: true, unitId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return c.json(users)
})

adminRoutes.post('/users', zValidator('json', userCreateSchema), async (c) => {
  const { password, ...rest } = c.req.valid('json')
  const user = await db.user.create({
    data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true, email: true, displayName: true, role: true, unitId: true },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: 'CREATE',
    entity: 'User',
    entityId: user.id,
    after: user,
  })
  return c.json(user, 201)
})

adminRoutes.patch('/users/:id', zValidator('json', userUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const { password, ...rest } = c.req.valid('json')
  const before = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, displayName: true, role: true, unitId: true },
  })
  if (!before) throw new HTTPException(404, { message: 'User not found' })
  const after = await db.user.update({
    where: { id },
    data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
    select: { id: true, email: true, displayName: true, role: true, unitId: true },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    before,
    after,
  })
  return c.json(after)
})

// ── Duty config ──

adminRoutes.get('/duty-config', async (c) => {
  const unitId = c.req.query('unitId')
  return c.json(await db.dutyConfig.findMany({ where: unitId ? { unitId } : undefined }))
})

adminRoutes.post('/duty-config', zValidator('json', dutyConfigUpsertSchema), async (c) => {
  const input = c.req.valid('json')
  const before = await db.dutyConfig.findUnique({
    where: { unitId_layer: { unitId: input.unitId, layer: input.layer } },
  })
  const config = input.config as Prisma.InputJsonValue
  const after = await db.dutyConfig.upsert({
    where: { unitId_layer: { unitId: input.unitId, layer: input.layer } },
    update: { config, poolKinds: input.poolKinds },
    create: { ...input, config },
  })
  await writeAudit({
    userId: c.get('user').id,
    action: before ? 'UPDATE' : 'CREATE',
    entity: 'DutyConfig',
    entityId: after.id,
    before,
    after,
  })
  return c.json(after)
})
