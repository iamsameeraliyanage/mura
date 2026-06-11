// Entry point for the Vercel serverless function. Bundled to api/index.js by
// scripts/build-api.mjs (run as part of npm run build) — Vercel cannot resolve
// extensionless ESM imports across folders, so we ship a single bundled file.
import { handle } from '@hono/node-server/vercel'
import { app } from './app'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handle(app)
