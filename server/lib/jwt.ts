import { SignJWT, jwtVerify } from 'jose'
import { ROLES, type Role, type RosterLayer } from '../../shared/types'
import { requireEnv } from '../env'

export interface AuthTokenPayload {
  sub: string // user id
  role: Role
  hospitalId: string | null
  departmentId: string | null
  unitId: string | null
  rosterLayers: RosterLayer[]
}

const secret = () => new TextEncoder().encode(requireEnv('JWT_SECRET'))

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    hospitalId: payload.hospitalId,
    departmentId: payload.departmentId,
    unitId: payload.unitId,
    rosterLayers: payload.rosterLayers,
  })
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
    // Tokens minted before the role-hierarchy migration carry retired role
    // names — treat them as expired so the user re-authenticates.
    if (!ROLES.includes(payload.role as Role)) return null
    return {
      sub: payload.sub,
      role: payload.role as Role,
      hospitalId: (payload.hospitalId as string | null) ?? null,
      departmentId: (payload.departmentId as string | null) ?? null,
      unitId: (payload.unitId as string | null) ?? null,
      rosterLayers: (payload.rosterLayers as RosterLayer[] | undefined) ?? [],
    }
  } catch {
    return null
  }
}
