import { useMe } from '../api/auth'
import { useHospitals } from '../api/admin'

/** Editors are scoped to their unit; the admin uses the first unit (Phase 1). */
export function useUnitId(): string | undefined {
  const { data: me } = useMe()
  const { data: hospitals } = useHospitals(me?.role === 'ADMIN')
  if (me?.unitId) return me.unitId
  return hospitals?.[0]?.departments[0]?.units[0]?.id
}
