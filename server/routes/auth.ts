import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import bcrypt from 'bcryptjs'
import { zValidator } from '@hono/zod-validator'
import { loginSchema } from '../../shared/schemas'
import { db } from '../db'
import { signAuthToken } from '../lib/jwt'
import { AUTH_COOKIE, requireAuth, type AuthEnv } from '../middleware/auth'
import { isProduction } from '../env'

export const authRoutes = new Hono<AuthEnv>()

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HTTPException(401, { message: 'Invalid email or password' })
  }

  const token = await signAuthToken({ sub: user.id, role: user.role, unitId: user.unitId })
  setCookie(c, AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches token expiry
  })

  return c.json(publicUser(user))
})

authRoutes.post('/logout', (c) => {
  deleteCookie(c, AUTH_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

authRoutes.get('/me', requireAuth, async (c) => {
  const user = await db.user.findUnique({ where: { id: c.get('user').id } })
  if (!user) throw new HTTPException(401, { message: 'Not authenticated' })
  return c.json(publicUser(user))
})

function publicUser(user: {
  id: string
  email: string
  displayName: string
  role: string
  unitId: string | null
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    unitId: user.unitId,
  }
}
