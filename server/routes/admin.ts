// Org-hierarchy CRUD with scoped guards (docs/02 §API):
//   SUPER_ADMIN      → hospitals + hospital admins
//   HOSPITAL_ADMIN   → departments + department admins (own hospital)
//   DEPARTMENT_ADMIN → wards, staff, roster types, roster admins (own department)
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { zValidator } from '@hono/zod-validator'
import type { Role, RosterLayer } from '../../shared/types'
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
import {
  assertUnitManage,
  assertUnitView,
  canManageDepartment,
  canManageHospital,
  getUnitScope,
  requireAuth,
  requireRole,
  type AuthEnv,
  type AuthUser,
} from '../middleware/auth'

export const adminRoutes = new Hono<AuthEnv>()

adminRoutes.use('*', requireAuth)

const day = (d: string) => new Date(`${d}T00:00:00.000Z`)

// ── Hospitals ──
// The tree every signed-in user sees is pre-filtered to their scope — it also
// powers the frontend's hospital/department/ward switcher.

adminRoutes.get('/hospitals', async (c) => {
  const user = c.get('user')
  const include = (departmentsWhere?: Prisma.DepartmentWhereInput, unitsWhere?: Prisma.UnitWhereInput) => ({
    departments: {
      where: departmentsWhere,
      include: { units: { where: unitsWhere, orderBy: { createdAt: 'asc' as const } } },
      orderBy: { createdAt: 'asc' as const },
    },
  })

  if (user.role === 'SUPER_ADMIN') {
    return c.json(await db.hospital.findMany({ include: include(), orderBy: { createdAt: 'asc' } }))
  }
  if (user.role === 'HOSPITAL_ADMIN') {
    return c.json(
      await db.hospital.findMany({
        where: { id: user.hospitalId ?? '__none__' },
        include: include(),
      }),
    )
  }
  if (user.role === 'DEPARTMENT_ADMIN') {
    return c.json(
      await db.hospital.findMany({
        where: { departments: { some: { id: user.departmentId ?? '__none__' } } },
        include: include({ id: user.departmentId ?? '__none__' }),
      }),
    )
  }
  // ROSTER_ADMIN: just their ward's chain.
  if (!user.unitId) return c.json([])
  const scope = await getUnitScope(user.unitId)
  return c.json(
    await db.hospital.findMany({
      where: { id: scope.hospitalId },
      include: include({ id: scope.departmentId }, { id: scope.unitId }),
    }),
  )
})

adminRoutes.post(
  '/hospitals',
  requireRole('SUPER_ADMIN'),
  zValidator('json', hospitalCreateSchema),
  async (c) => {
    const hospital = await db.hospital.create({ data: c.req.valid('json') })
    await writeAudit({
      userId: c.get('user').id,
      action: 'CREATE',
      entity: 'Hospital',
      entityId: hospital.id,
      after: hospital,
    })
    return c.json(hospital, 201)
  },
)

adminRoutes.patch(
  '/hospitals/:id',
  requireRole('SUPER_ADMIN'),
  zValidator('json', hospitalUpdateSchema),
  async (c) => {
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
  },
)

// ── Departments (hospital admins and above) ──

adminRoutes.post('/departments', zValidator('json', departmentCreateSchema), async (c) => {
  const input = c.req.valid('json')
  if (!canManageHospital(c.get('user'), input.hospitalId)) {
    throw new HTTPException(403, { message: 'Out of scope' })
  }
  const department = await db.department.create({ data: input })
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
  if (!canManageHospital(c.get('user'), before.hospitalId)) {
    throw new HTTPException(403, { message: 'Out of scope' })
  }
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

// ── Units / wards (department admins and above) ──

adminRoutes.post('/units', zValidator('json', unitCreateSchema), async (c) => {
  const input = c.req.valid('json')
  const department = await db.department.findUnique({ where: { id: input.departmentId } })
  if (!department) throw new HTTPException(404, { message: 'Department not found' })
  if (
    !canManageDepartment(c.get('user'), {
      departmentId: department.id,
      hospitalId: department.hospitalId,
    })
  ) {
    throw new HTTPException(403, { message: 'Out of scope' })
  }
  const unit = await db.unit.create({ data: input })
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
  await assertUnitManage(c, id)
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

// ── Staff (reads live in staff.ts; department admins manage) ──

adminRoutes.post('/staff', zValidator('json', staffCreateSchema), async (c) => {
  const input = c.req.valid('json')
  await assertUnitManage(c, input.unitId)
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
  await assertUnitManage(c, before.unitId)
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
// Each admin can only mint accounts one level (or more) below themselves,
// inside their own scope: SUPER→anything, HOSPITAL_ADMIN→department & roster
// admins in their hospital, DEPARTMENT_ADMIN→roster admins in their wards.

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  hospitalId: true,
  departmentId: true,
  unitId: true,
  rosterLayers: true,
  staffId: true,
  createdAt: true,
} as const

async function assertCanGrant(
  user: AuthUser,
  target: {
    role: Role
    hospitalId?: string | null
    departmentId?: string | null
    unitId?: string | null
  },
) {
  switch (target.role) {
    case 'SUPER_ADMIN':
      if (user.role !== 'SUPER_ADMIN') throw new HTTPException(403, { message: 'Forbidden' })
      return
    case 'HOSPITAL_ADMIN':
      if (!canManageHospital(user, target.hospitalId!)) {
        throw new HTTPException(403, { message: 'Out of scope' })
      }
      return
    case 'DEPARTMENT_ADMIN': {
      const dept = await db.department.findUnique({ where: { id: target.departmentId! } })
      if (!dept) throw new HTTPException(404, { message: 'Department not found' })
      if (!canManageHospital(user, dept.hospitalId)) {
        throw new HTTPException(403, { message: 'Department admins are assigned by the hospital admin' })
      }
      return
    }
    case 'ROSTER_ADMIN': {
      const scope = await getUnitScope(target.unitId!)
      if (!canManageDepartment(user, scope)) {
        throw new HTTPException(403, { message: 'Out of scope' })
      }
      return
    }
  }
}

/** Keep only the scope field that matches the role. */
function scopeFor(target: {
  role: Role
  hospitalId?: string | null
  departmentId?: string | null
  unitId?: string | null
  rosterLayers?: RosterLayer[]
  staffId?: string | null
}) {
  return {
    hospitalId: target.role === 'HOSPITAL_ADMIN' ? (target.hospitalId ?? null) : null,
    departmentId: target.role === 'DEPARTMENT_ADMIN' ? (target.departmentId ?? null) : null,
    unitId: target.role === 'ROSTER_ADMIN' ? (target.unitId ?? null) : null,
    rosterLayers: target.role === 'ROSTER_ADMIN' ? (target.rosterLayers ?? []) : [],
    staffId: target.staffId ?? null,
  }
}

adminRoutes.get(
  '/users',
  requireRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN'),
  async (c) => {
    const user = c.get('user')
    let where: Prisma.UserWhereInput | undefined
    if (user.role === 'HOSPITAL_ADMIN') {
      const h = user.hospitalId ?? '__none__'
      where = {
        OR: [
          { id: user.id },
          { hospitalId: h },
          { department: { hospitalId: h } },
          { unit: { department: { hospitalId: h } } },
        ],
      }
    } else if (user.role === 'DEPARTMENT_ADMIN') {
      const d = user.departmentId ?? '__none__'
      where = { OR: [{ id: user.id }, { departmentId: d }, { unit: { departmentId: d } }] }
    }
    return c.json(
      await db.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'asc' } }),
    )
  },
)

adminRoutes.post('/users', zValidator('json', userCreateSchema), async (c) => {
  const { password, ...rest } = c.req.valid('json')
  const user = c.get('user')
  await assertCanGrant(user, rest)
  const created = await db.user.create({
    data: {
      email: rest.email,
      displayName: rest.displayName,
      role: rest.role,
      ...scopeFor(rest),
      passwordHash: await bcrypt.hash(password, 10),
    },
    select: userSelect,
  })
  await writeAudit({
    userId: user.id,
    action: 'CREATE',
    entity: 'User',
    entityId: created.id,
    after: created,
  })
  return c.json(created, 201)
})

adminRoutes.patch('/users/:id', zValidator('json', userUpdateSchema), async (c) => {
  const id = c.req.param('id')
  const { password, ...rest } = c.req.valid('json')
  const user = c.get('user')
  const before = await db.user.findUnique({ where: { id }, select: userSelect })
  if (!before) throw new HTTPException(404, { message: 'User not found' })

  // Must control both who they are now and who they would become.
  await assertCanGrant(user, before)
  const effective = { ...before, ...rest, role: rest.role ?? before.role }
  await assertCanGrant(user, effective)

  const after = await db.user.update({
    where: { id },
    data: {
      displayName: rest.displayName,
      ...(rest.role ? { role: rest.role, ...scopeFor(effective) } : {}),
      ...(rest.role === undefined && rest.rosterLayers && before.role === 'ROSTER_ADMIN'
        ? { rosterLayers: rest.rosterLayers }
        : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
    select: userSelect,
  })
  await writeAudit({
    userId: user.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    before,
    after,
  })
  return c.json(after)
})

// ── Duty config = roster types (department admins create them) ──

adminRoutes.get('/duty-config', async (c) => {
  const unitId = c.req.query('unitId')
  if (!unitId) throw new HTTPException(400, { message: 'unitId required' })
  await assertUnitView(c, unitId)
  return c.json(
    await db.dutyConfig.findMany({ where: { unitId }, orderBy: { layer: 'asc' } }),
  )
})

adminRoutes.post('/duty-config', zValidator('json', dutyConfigUpsertSchema), async (c) => {
  const input = c.req.valid('json')
  await assertUnitManage(c, input.unitId)
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

adminRoutes.delete('/duty-config/:id', async (c) => {
  const id = c.req.param('id')
  const cfg = await db.dutyConfig.findUnique({ where: { id } })
  if (!cfg) throw new HTTPException(404, { message: 'Roster type not found' })
  await assertUnitManage(c, cfg.unitId)
  const rosterCount = await db.roster.count({ where: { unitId: cfg.unitId, layer: cfg.layer } })
  if (rosterCount > 0) {
    throw new HTTPException(409, {
      message: `This roster type has ${rosterCount} generated roster(s) — it can't be removed`,
    })
  }
  await db.dutyConfig.delete({ where: { id } })
  await writeAudit({
    userId: c.get('user').id,
    action: 'DELETE',
    entity: 'DutyConfig',
    entityId: id,
    before: cfg,
  })
  return c.json({ ok: true })
})
