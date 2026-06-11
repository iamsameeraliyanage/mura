// Local API server for development (production uses api/[[...route]].ts on Vercel).
// Run with: npm run dev:api — vite proxies /api here.
import { serve } from '@hono/node-server'
import { app } from './app'

const port = 8787
serve({ fetch: app.fetch, port }, () => {
  console.log(`API dev server: http://localhost:${port}/api/health`)
})
