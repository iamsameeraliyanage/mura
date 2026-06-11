import type { AuditAction, Prisma } from '@prisma/client'
import { db } from '../db'

/** Every mutation writes an audit row — hard rule #3 (CLAUDE.md). */
export function writeAudit(input: {
  userId: string
  action: AuditAction
  entity: string
  entityId: string
  before?: unknown
  after?: unknown
}) {
  return db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: (input.before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (input.after ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}
