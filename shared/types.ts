// Shared between src/ (SPA) and server/. Mirrors prisma/schema.prisma enums —
// keep in sync when the schema changes.

export const ROSTER_LAYERS = ['CONSULTANT', 'SHO'] as const
export type RosterLayer = (typeof ROSTER_LAYERS)[number]

export const ROSTER_STATUSES = ['DRAFT', 'PUBLISHED'] as const
export type RosterStatus = (typeof ROSTER_STATUSES)[number]

export const STAFF_KINDS = ['CONSULTANT', 'SHO', 'RHO', 'HO', 'MO', 'NURSE'] as const
export type StaffKind = (typeof STAFF_KINDS)[number]

export const ROLES = ['ADMIN', 'CONSULTANT_EDITOR', 'SHO_EDITOR'] as const
export type Role = (typeof ROLES)[number]

/** Roster month in "YYYY-MM" form (Asia/Colombo month). */
export type RosterMonth = string
