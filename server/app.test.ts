import { expect, it } from 'vitest'
import { app } from './app'

it('GET /api/health returns ok', async () => {
  const res = await app.request('/api/health')
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ ok: true })
})
