import { SignJWT, jwtVerify } from 'jose'
import type { Role } from '../../shared/types'
import { requireEnv } from '../env'

export interface AuthTokenPayload {
  sub: string // user id
  role: Role
  unitId: string | null
}

const secret = () => new TextEncoder().encode(requireEnv('JWT_SECRET'))

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role, unitId: payload.unitId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (typeof payload.sub !== 'string') return null
    return {
      sub: payload.sub,
      role: payload.role as Role,
      unitId: (payload.unitId as string | null) ?? null,
    }
  } catch {
    return null
  }
}
