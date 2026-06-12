import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { Role, RosterLayer } from '../../shared/types'
import { api } from './client'

export interface Me {
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

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Me>('/auth/me')
        return data
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 401) return null
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<Me>('/auth/login', input)
      return data
    },
    onSuccess: (me) => queryClient.setQueryData(['me'], me),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => queryClient.setQueryData(['me'], null),
  })
}
