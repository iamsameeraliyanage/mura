import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RosterLayer, RosterStatus } from '../../shared/types'
import { api } from './client'

export interface SlotStaff {
  id: string
  fullName: string
  shortCode: string
  colorKey: string
  kind?: string
}

export interface Slot {
  id: string
  rosterId: string
  date: string // ISO datetime, date part is the calendar day
  staffId: string
  staff: SlotStaff
  startsAt: string
  endsAt: string
  isCash: boolean
  isPostCash: boolean
  isWeekendBlock: boolean
  secondOnCallId: string | null
  secondOnCall: SlotStaff | null
  conflictFlag: boolean
  conflictReason: string | null
}

export interface Roster {
  id: string
  unitId: string
  layer: RosterLayer
  month: string
  status: RosterStatus
  version: number
  builtAgainstVersion: number | null
  publishedAt: string | null
  slots: Slot[]
}

export interface Violation {
  rule: string
  message: string
  date?: string
  staffId?: string
}

export interface RosterResponse {
  roster: Roster | null
  violations: Violation[]
}

const rosterKey = (unitId: string, layer: RosterLayer, month: string) => [
  'roster',
  unitId,
  layer,
  month,
]

export function useRoster(unitId: string | undefined, layer: RosterLayer, month: string) {
  return useQuery({
    queryKey: rosterKey(unitId ?? '?', layer, month),
    enabled: !!unitId,
    queryFn: async () =>
      (await api.get<RosterResponse>('/rosters', { params: { unitId, layer, month } })).data,
  })
}

/** All roster mutations return the fresh { roster, violations } — write it
 *  straight into the cache so fairness/violations update with the swap. */
function useRosterMutation<TInput>(fn: (input: TInput) => Promise<RosterResponse>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (data.roster) {
        queryClient.setQueryData(
          rosterKey(data.roster.unitId, data.roster.layer, data.roster.month),
          data,
        )
      }
      queryClient.invalidateQueries({ queryKey: ['fairness'] })
      queryClient.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export const useGenerateRoster = () =>
  useRosterMutation(
    async (input: { unitId: string; layer: RosterLayer; month: string }) =>
      (await api.post<RosterResponse>('/rosters/generate', input)).data,
  )

export const useSwapSlots = () =>
  useRosterMutation(
    async (input: { rosterId: string; slotAId: string; slotBId: string }) =>
      (
        await api.patch<RosterResponse>(`/rosters/${input.rosterId}/swap`, {
          slotAId: input.slotAId,
          slotBId: input.slotBId,
        })
      ).data,
  )

export const useAssignSlot = () =>
  useRosterMutation(
    async (input: { rosterId: string; slotId: string; staffId: string }) =>
      (
        await api.patch<RosterResponse>(`/rosters/${input.rosterId}/slots/${input.slotId}`, {
          staffId: input.staffId,
        })
      ).data,
  )

export const useAssignDay = () =>
  useRosterMutation(
    async (input: {
      rosterId: string
      date: string
      staffId: string
      isWeekendBlock?: boolean
      isCash?: boolean
      isPostCash?: boolean
    }) =>
      (
        await api.put<RosterResponse>(`/rosters/${input.rosterId}/days/${input.date}`, {
          staffId: input.staffId,
          isWeekendBlock: input.isWeekendBlock,
          isCash: input.isCash,
          isPostCash: input.isPostCash,
        })
      ).data,
  )

export const useSetSecondOnCall = () =>
  useRosterMutation(
    async (input: { rosterId: string; slotId: string; staffId: string | null }) =>
      (
        await api.patch<RosterResponse>(
          `/rosters/${input.rosterId}/slots/${input.slotId}/second-on-call`,
          { staffId: input.staffId },
        )
      ).data,
  )

export const usePublishRoster = () =>
  useRosterMutation(
    async (input: { rosterId: string }) =>
      (await api.post<RosterResponse>(`/rosters/${input.rosterId}/publish`)).data,
  )

// ── Fairness ──

export interface FairnessResponse {
  perMonth: { month: string; status: RosterStatus; tally: Record<string, Record<string, number>> }[]
  cumulative: Record<string, Record<string, number>>
  staff: (SlotStaff & { kind: string; activeUntil: string | null })[]
}

export function useFairness(
  unitId: string | undefined,
  layer: RosterLayer,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: ['fairness', unitId ?? '?', layer, from ?? '', to ?? ''],
    enabled: !!unitId,
    queryFn: async () =>
      (await api.get<FairnessResponse>('/fairness', { params: { unitId, layer, from, to } })).data,
  })
}

// ── Audit ──

export interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string
  before: unknown
  after: unknown
  createdAt: string
  user: { displayName: string; role: string }
}

export function useAudit(filter: { entity?: string; entityId?: string; take?: number } = {}) {
  return useQuery({
    queryKey: ['audit', filter],
    queryFn: async () => (await api.get<AuditEntry[]>('/audit', { params: filter })).data,
  })
}
