// Entry point for the Vercel serverless function. Bundled to api/index.js by
// scripts/build-api.mjs (run as part of npm run build) — Vercel cannot resolve
// extensionless ESM imports across folders, so we ship a single bundled file.
//
// Uses the Web-standard handler (Request → Response): Vercel's Node helpers
// pre-consume the body stream of (req, res)-style functions, which makes
// POST bodies hang with the node-server adapter.
import { handle } from 'hono/vercel'
import { app } from './app'

export default handle(app)
