// Vercel catch-all → Hono app. Do not put logic here (see docs/02).
import { handle } from '@hono/node-server/vercel'
import { app } from '../server/app'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handle(app)
