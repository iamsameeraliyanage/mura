import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role, RosterLayer, StaffKind } from '../../shared/types'
import { api } from './client'

// ── Types (API shapes) ──

export interface Unit {
  id: string
  departmentId: string
  name: string
}
export interface Department {
  id: string
  hospitalId: string
  name: string
  units: Unit[]
}
export interface Hospital {
  id: string
  name: string
  city: string | null
  departments: Department[]
}

export interface Unavailability {
  id: string
  staffId: string
  from: string
  to: string
  reason: string | null
}

export interface Staff {
  id: string
  unitId: string
  kind: StaffKind
  fullName: string
  shortCode: string
  colorKey: string
  isSeat: boolean
  currentHolder: string | null
  activeFrom: string
  activeUntil: string | null
  unavailability: Unavailability[]
}

export interface AppUser {
  id: string
  email: string
  displayName: string
  role: Role
  hospitalId: string | null
  departmentId: string | null
  unitId: string | null
  rosterLayers: RosterLayer[]
  staffId: string | null
}

export interface DutyConfig {
  id: string
  unitId: string
  layer: RosterLayer
  config: Record<string, unknown>
  poolKinds: StaffKind[]
}

// ── Queries ──

export const useHospitals = (enabled = true) =>
  useQuery({
    queryKey: ['hospitals'],
    enabled,
    queryFn: async () => (await api.get<Hospital[]>('/hospitals')).data,
  })

export const useStaff = (unitId?: string) =>
  useQuery({
    queryKey: ['staff', unitId ?? 'all'],
    queryFn: async () =>
      (await api.get<Staff[]>('/staff', { params: unitId ? { unitId } : {} })).data,
  })

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AppUser[]>('/users')).data,
  })

export const useDutyConfigs = (unitId?: string) =>
  useQuery({
    queryKey: ['duty-config', unitId ?? 'none'],
    enabled: !!unitId,
    queryFn: async () => (await api.get<DutyConfig[]>('/duty-config', { params: { unitId } })).data,
  })

// ── Mutations (generic invalidating helper) ──

function useInvalidating<TInput>(fn: (input: TInput) => Promise<unknown>, keys: string[][]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key })),
  })
}

export const useCreateHospital = () =>
  useInvalidating(
    (input: { name: string; city?: string }) => api.post('/hospitals', input),
    [['hospitals']],
  )

export const useCreateDepartment = () =>
  useInvalidating(
    (input: { hospitalId: string; name: string }) => api.post('/departments', input),
    [['hospitals']],
  )

export const useCreateUnit = () =>
  useInvalidating(
    (input: { departmentId: string; name: string }) => api.post('/units', input),
    [['hospitals']],
  )

export interface StaffInput {
  unitId: string
  kind: StaffKind
  fullName: string
  shortCode: string
  colorKey: string
  isSeat?: boolean
  currentHolder?: string | null
  activeFrom: string
  activeUntil?: string | null
}

export const useCreateStaff = () =>
  useInvalidating((input: StaffInput) => api.post('/staff', input), [['staff']])

export const useUpdateStaff = () =>
  useInvalidating(
    ({ id, ...input }: Partial<StaffInput> & { id: string }) => api.patch(`/staff/${id}`, input),
    [['staff']],
  )

export interface UserInput {
  email: string
  password: string
  displayName: string
  role: Role
  hospitalId?: string | null
  departmentId?: string | null
  unitId?: string | null
  rosterLayers?: RosterLayer[]
  staffId?: string | null
}

export const useCreateUser = () => useInvalidating((input: UserInput) => api.post('/users', input), [['users']])

export const useUpdateUser = () =>
  useInvalidating(
    ({ id, ...input }: Partial<UserInput> & { id: string }) => api.patch(`/users/${id}`, input),
    [['users']],
  )

export const useUpsertDutyConfig = () =>
  useInvalidating(
    (input: {
      unitId: string
      layer: RosterLayer
      config: Record<string, unknown>
      poolKinds: StaffKind[]
    }) => api.post('/duty-config', input),
    [['duty-config']],
  )

export const useDeleteDutyConfig = () =>
  useInvalidating((id: string) => api.delete(`/duty-config/${id}`), [['duty-config']])

export interface PublicHoliday {
  id: string
  date: string
  name: string
}

export const useHolidays = (month?: string) =>
  useQuery({
    queryKey: ['public-holidays', month ?? 'all'],
    queryFn: async () =>
      (await api.get<PublicHoliday[]>('/public-holidays', { params: month ? { month } : {} }))
        .data,
  })

export const useCreateHoliday = () =>
  useInvalidating(
    (input: { date: string; name: string }) => api.post('/public-holidays', input),
    [['public-holidays']],
  )

export const useDeleteHoliday = () =>
  useInvalidating((id: string) => api.delete(`/public-holidays/${id}`), [['public-holidays']])

export const useCreateUnavailability = () =>
  useInvalidating(
    (input: { staffId: string; from: string; to: string; reason?: string }) =>
      api.post('/unavailability', input),
    [['staff']],
  )

export const useDeleteUnavailability = () =>
  useInvalidating((id: string) => api.delete(`/unavailability/${id}`), [['staff']])
