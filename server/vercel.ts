// Entry point for the Vercel serverless function. Bundled to api/index.js by
// scripts/build-api.mjs (run as part of npm run build) — Vercel cannot resolve
// extensionless ESM imports across folders, so we ship a single bundled file.
//
// Custom (req, res) adapter: Vercel's Node helpers pre-parse POST bodies and
// consume the stream, which makes stream-reading adapters hang. This one uses
// the pre-parsed `req.body` when helpers are on and falls back to reading the
// stream when they're off.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { app } from './app'

type VercelRequest = IncomingMessage & { body?: unknown }

export default async function handler(req: VercelRequest, res: ServerResponse) {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https'
  const host = req.headers.host ?? 'localhost'
  const url = `${proto}://${host}${req.url ?? '/'}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    // recomputed by the Request constructor / invalid after re-serialization
    if (key === 'content-length' || key === 'transfer-encoding') continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  }

  let body: BodyInit | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body !== undefined && req.body !== null) {
      // helpers already parsed it (object for JSON, string/Buffer otherwise)
      body =
        typeof req.body === 'string'
          ? req.body
          : Buffer.isBuffer(req.body)
            ? new Uint8Array(req.body)
            : JSON.stringify(req.body)
    } else {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      if (chunks.length > 0) body = new Uint8Array(Buffer.concat(chunks))
    }
  }

  const response = await app.fetch(new Request(url, { method: req.method, headers, body }))

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key !== 'set-cookie') res.setHeader(key, value)
  })
  const cookies = response.headers.getSetCookie()
  if (cookies.length > 0) res.setHeader('set-cookie', cookies)

  res.end(Buffer.from(await response.arrayBuffer()))
}
