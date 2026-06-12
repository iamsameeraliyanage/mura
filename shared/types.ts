// Shared between src/ (SPA) and server/. Mirrors prisma/schema.prisma enums —
// keep in sync when the schema changes.

export const ROSTER_LAYERS = ['CONSULTANT', 'SHO', 'HO', 'MO', 'NURSE'] as const
export type RosterLayer = (typeof ROSTER_LAYERS)[number]

export const ROSTER_STATUSES = ['DRAFT', 'PUBLISHED'] as const
export type RosterStatus = (typeof ROSTER_STATUSES)[number]

export const STAFF_KINDS = ['CONSULTANT', 'SHO', 'RHO', 'HO', 'MO', 'NURSE'] as const
export type StaffKind = (typeof STAFF_KINDS)[number]

// Hierarchy: each role manages everything below its scope.
export const ROLES = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN', 'ROSTER_ADMIN'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  HOSPITAL_ADMIN: 'Hospital admin',
  DEPARTMENT_ADMIN: 'Department admin',
  ROSTER_ADMIN: 'Roster admin',
}

/** Display name of each roster type (a DutyConfig row = one roster type). */
export const LAYER_LABELS: Record<RosterLayer, string> = {
  CONSULTANT: 'Consultant casualty',
  SHO: 'SHO/RHO on-call',
  HO: 'HO on-call',
  MO: 'MO on-call',
  NURSE: 'Nurses on-call',
}

/** Default assignment pool when a roster type doesn't override poolKinds. */
export const LAYER_DEFAULT_POOL: Record<RosterLayer, StaffKind[]> = {
  CONSULTANT: ['CONSULTANT'],
  SHO: ['SHO', 'RHO'],
  HO: ['HO'],
  MO: ['MO'],
  NURSE: ['NURSE'],
}

/** Roster month in "YYYY-MM" form (Asia/Colombo month). */
export type RosterMonth = string
