import { beforeAll, expect, it } from 'vitest'
import { signAuthToken, verifyAuthToken } from './jwt'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-bytes-long!!'
})

it('round-trips a token', async () => {
  const payload = {
    sub: 'user-1',
    role: 'ROSTER_ADMIN',
    hospitalId: null,
    departmentId: null,
    unitId: 'unit-1',
    rosterLayers: ['SHO'],
  } as const
  const token = await signAuthToken({ ...payload, rosterLayers: ['SHO'] })
  expect(await verifyAuthToken(token)).toEqual(payload)
})

it('rejects a tampered token', async () => {
  const token = await signAuthToken({
    sub: 'user-1',
    role: 'SUPER_ADMIN',
    hospitalId: null,
    departmentId: null,
    unitId: null,
    rosterLayers: [],
  })
  expect(await verifyAuthToken(token + 'x')).toBeNull()
  expect(await verifyAuthToken('garbage')).toBeNull()
})

it('rejects tokens minted with retired pre-hierarchy roles', async () => {
  const token = await signAuthToken({
    // role names from before the role-hierarchy migration
    role: 'ADMIN' as never,
    sub: 'user-1',
    hospitalId: null,
    departmentId: null,
    unitId: null,
    rosterLayers: [],
  })
  expect(await verifyAuthToken(token)).toBeNull()
})
