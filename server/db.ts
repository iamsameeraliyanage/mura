import { PrismaClient } from '@prisma/client'

// Lazy singleton: constructing PrismaClient at module load crashes the whole
// serverless function (FUNCTION_INVOCATION_FAILED) if anything is wrong with
// the generated client or env — before any route (even /health) can respond.
// Deferring to first use keeps the function bootable and surfaces DB errors
// as proper 500s per-request instead. Also reuses one client across warm
// invocations so Neon's pooled connections aren't exhausted.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getClient(): PrismaClient {
  return (globalForPrisma.prisma ??= new PrismaClient())
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
