import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { staffRoutes } from './routes/staff'
import { unavailabilityRoutes } from './routes/unavailability'
import { auditRoutes, fairnessRoutes, rosterRoutes } from './routes/rosters'

export const app = new Hono().basePath('/api')

app.get('/health', (c) => c.json({ ok: true }))
app.route('/auth', authRoutes)
app.route('/staff', staffRoutes)
app.route('/unavailability', unavailabilityRoutes)
app.route('/rosters', rosterRoutes)
app.route('/fairness', fairnessRoutes)
app.route('/audit', auditRoutes)
// adminRoutes guards everything it matches with requireRole(ADMIN) on '*',
// so it must be mounted LAST — earlier mounts win for their own paths.
app.route('/', adminRoutes)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})
