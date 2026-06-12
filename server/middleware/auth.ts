import type { Context, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import type { Role, RosterLayer } from '../../shared/types'
import { db } from '../db'
import { verifyAuthToken, type AuthTokenPayload } from '../lib/jwt'

export const AUTH_COOKIE = 'mura_auth'

export interface AuthUser {
  id: string
  role: Role
  hospitalId: string | null
  departmentId: string | null
  unitId: string | null
  rosterLayers: RosterLayer[]
}

export type AuthEnv = { Variables: { user: AuthUser } }

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, AUTH_COOKIE)
  const payload = token ? await verifyAuthToken(token) : null
  if (!payload) throw new HTTPException(401, { message: 'Not authenticated' })
  c.set('user', toUser(payload))
  await next()
})

export function requireRole(...roles: Role[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      throw new HTTPException(403, { message: 'Forbidden' })
    }
    await next()
  })
}

// ── Scope resolution ─────────────────────────────────────────────
// Every check resolves a unit/department up its chain once, then compares
// against the caller's single scope field for their role.

export interface UnitScope {
  unitId: string
  departmentId: string
  hospitalId: string
}

export async function getUnitScope(unitId: string): Promise<UnitScope> {
  const unit = await db.unit.findUnique({ where: { id: unitId }, include: { department: true } })
  if (!unit) throw new HTTPException(404, { message: 'Ward not found' })
  return { unitId: unit.id, departmentId: unit.departmentId, hospitalId: unit.department.hospitalId }
}

export function canManageHospital(user: AuthUser, hospitalId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  return user.role === 'HOSPITAL_ADMIN' && user.hospitalId === hospitalId
}

export function canManageDepartment(
  user: AuthUser,
  scope: { departmentId: string; hospitalId: string },
): boolean {
  if (canManageHospital(user, scope.hospitalId)) return true
  return user.role === 'DEPARTMENT_ADMIN' && user.departmentId === scope.departmentId
}

/** Read access to a ward: every admin above it, plus its roster admins. */
export function canViewUnit(user: AuthUser, scope: UnitScope): boolean {
  if (canManageDepartment(user, scope)) return true
  return user.role === 'ROSTER_ADMIN' && user.unitId === scope.unitId
}

/** Write access to one roster type: department admins and above, or the
 *  roster admin assigned to that layer in that ward. */
export function canEditRoster(user: AuthUser, scope: UnitScope, layer: RosterLayer): boolean {
  if (canManageDepartment(user, scope)) return true
  return (
    user.role === 'ROSTER_ADMIN' &&
    user.unitId === scope.unitId &&
    user.rosterLayers.includes(layer)
  )
}

// ── Route guards (throw 403/404) ──

export async function assertUnitView(c: Context<AuthEnv>, unitId: string): Promise<UnitScope> {
  const scope = await getUnitScope(unitId)
  if (!canViewUnit(c.get('user'), scope)) throw new HTTPException(403, { message: 'Out of scope' })
  return scope
}

export async function assertUnitManage(c: Context<AuthEnv>, unitId: string): Promise<UnitScope> {
  const scope = await getUnitScope(unitId)
  if (!canManageDepartment(c.get('user'), scope)) {
    throw new HTTPException(403, { message: 'Out of scope' })
  }
  return scope
}

export async function assertRosterEdit(
  c: Context<AuthEnv>,
  unitId: string,
  layer: RosterLayer,
): Promise<UnitScope> {
  const scope = await getUnitScope(unitId)
  if (!canEditRoster(c.get('user'), scope, layer)) {
    throw new HTTPException(403, { message: 'You are not an admin of this roster' })
  }
  return scope
}

/** Prisma `where` fragment limiting StaffMember/Unit-joined queries to the
 *  caller's visible wards. Returns undefined when the caller sees everything. */
export function visibleUnitsWhere(
  user: AuthUser,
): { departmentId?: string; department?: { hospitalId: string }; id?: string } | undefined {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return undefined
    case 'HOSPITAL_ADMIN':
      return { department: { hospitalId: user.hospitalId ?? '__none__' } }
    case 'DEPARTMENT_ADMIN':
      return { departmentId: user.departmentId ?? '__none__' }
    case 'ROSTER_ADMIN':
      return { id: user.unitId ?? '__none__' }
  }
}

function toUser(payload: AuthTokenPayload): AuthUser {
  return {
    id: payload.sub,
    role: payload.role,
    hospitalId: payload.hospitalId,
    departmentId: payload.departmentId,
    unitId: payload.unitId,
    rosterLayers: payload.rosterLayers,
  }
}

export type { Next }
