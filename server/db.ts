import { PrismaClient } from '@prisma/client'

// Serverless functions can re-evaluate modules across invocations in dev;
// reuse a single client to avoid exhausting Neon's pooled connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
