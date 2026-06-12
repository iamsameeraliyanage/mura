import { beforeAll, expect, it } from 'vitest'
import { signAuthToken, verifyAuthToken } from './jwt'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-bytes-long!!'
})

it('round-trips a token', async () => {
  const token = await signAuthToken({ sub: 'user-1', role: 'SHO_EDITOR', unitId: 'unit-1' })
  const payload = await verifyAuthToken(token)
  expect(payload).toEqual({ sub: 'user-1', role: 'SHO_EDITOR', unitId: 'unit-1' })
})

it('rejects a tampered token', async () => {
  const token = await signAuthToken({ sub: 'user-1', role: 'ADMIN', unitId: null })
  expect(await verifyAuthToken(token + 'x')).toBeNull()
  expect(await verifyAuthToken('garbage')).toBeNull()
})
