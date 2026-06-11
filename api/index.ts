// Vercel function → Hono app. All /api/* requests are rewritten here
// (vercel.json); Hono routes on the original URL. Do not put logic here.
import { handle } from '@hono/node-server/vercel'
import { app } from '../server/app'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handle(app)
