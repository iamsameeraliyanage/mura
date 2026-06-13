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

/** "YYYY-MM-DD" calendar date (Asia/Colombo). */
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ── Admin: org hierarchy ──

export const hospitalCreateSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1).optional(),
})
export const hospitalUpdateSchema = hospitalCreateSchema.partial()

export const departmentCreateSchema = z.object({
  hospitalId: z.string().min(1),
  name: z.string().min(1),
})
export const departmentUpdateSchema = z.object({ name: z.string().min(1) })

export const unitCreateSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().min(1),
})
export const unitUpdateSchema = z.object({ name: z.string().min(1) })

// ── Admin: staff ──

export const staffCreateSchema = z.object({
  unitId: z.string().min(1),
  kind: staffKindSchema,
  fullName: z.string().min(1),
  shortCode: z.string().min(1).max(4),
  colorKey: z.string().regex(/^pen-[a-z]+$/),
  isSeat: z.boolean().optional(),
  currentHolder: z.string().nullable().optional(),
  activeFrom: dateStringSchema,
  activeUntil: dateStringSchema.nullable().optional(),
})
export const staffUpdateSchema = staffCreateSchema.omit({ unitId: true }).partial()

// ── Admin: users ──
// Each role carries exactly one scope: HOSPITAL_ADMIN→hospitalId,
// DEPARTMENT_ADMIN→departmentId, ROSTER_ADMIN→unitId+rosterLayers.

const userScopeShape = {
  hospitalId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  rosterLayers: z.array(rosterLayerSchema).optional(),
  staffId: z.string().nullable().optional(),
}

function checkUserScope(
  v: { role?: z.infer<typeof roleSchema> } & {
    hospitalId?: string | null
    departmentId?: string | null
    unitId?: string | null
    rosterLayers?: string[]
  },
  ctx: z.RefinementCtx,
) {
  if (v.role === 'HOSPITAL_ADMIN' && !v.hospitalId)
    ctx.addIssue({ code: 'custom', message: 'A hospital admin needs a hospital' })
  if (v.role === 'DEPARTMENT_ADMIN' && !v.departmentId)
    ctx.addIssue({ code: 'custom', message: 'A department admin needs a department' })
  if (v.role === 'ROSTER_ADMIN' && (!v.unitId || !v.rosterLayers?.length))
    ctx.addIssue({ code: 'custom', message: 'A roster admin needs a ward and at least one roster' })
}

export const userCreateSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1),
    role: roleSchema,
    ...userScopeShape,
  })
  .superRefine(checkUserScope)

export const userUpdateSchema = z
  .object({
    password: z.string().min(8).optional(),
    displayName: z.string().min(1).optional(),
    role: roleSchema.optional(),
    ...userScopeShape,
  })
  .superRefine((v, ctx) => {
    if (v.role) checkUserScope(v, ctx)
  })

// ── Admin: duty config ──

export const dutyConfigUpsertSchema = z.object({
  unitId: z.string().min(1),
  layer: rosterLayerSchema,
  config: z.record(z.unknown()),
  poolKinds: z.array(staffKindSchema).min(1),
})

// ── Public holidays ──

export const publicHolidayCreateSchema = z.object({
  date: dateStringSchema,
  name: z.string().min(1).max(80),
})

// ── Unavailability ──

export const unavailabilityCreateSchema = z
  .object({
    staffId: z.string().min(1),
    from: dateStringSchema,
    to: dateStringSchema,
    reason: z.string().optional(),
  })
  .refine((v) => v.from <= v.to, { message: 'from must be on or before to' })
