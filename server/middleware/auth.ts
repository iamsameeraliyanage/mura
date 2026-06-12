import type { Context, Next } from 'hono'
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import type { Role } from '../../shared/types'
import { verifyAuthToken, type AuthTokenPayload } from '../lib/jwt'

export const AUTH_COOKIE = 'mura_auth'

export interface AuthUser {
  id: string
  role: Role
  unitId: string | null
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

/** Editors may only touch their own unit; admins may touch any. */
export function assertScope(c: Context<AuthEnv>, unitId: string) {
  const user = c.get('user')
  if (user.role === 'ADMIN') return
  if (user.unitId !== unitId) throw new HTTPException(403, { message: 'Out of scope' })
}

function toUser(payload: AuthTokenPayload): AuthUser {
  return { id: payload.sub, role: payload.role, unitId: payload.unitId }
}

export type { Next }
