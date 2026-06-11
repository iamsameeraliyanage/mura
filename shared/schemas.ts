import { z } from 'zod'
import { ROLES, ROSTER_LAYERS, ROSTER_STATUSES, STAFF_KINDS } from './types'

export const rosterLayerSchema = z.enum(ROSTER_LAYERS)
export const rosterStatusSchema = z.enum(ROSTER_STATUSES)
export const staffKindSchema = z.enum(STAFF_KINDS)
export const roleSchema = z.enum(ROLES)

/** "YYYY-MM" — the month a roster covers (Asia/Colombo). */
export const rosterMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
  message: 'Month must be in YYYY-MM format',
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
