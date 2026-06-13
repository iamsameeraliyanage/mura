// Org scope the whole app is viewing: hospital → department → ward (unit).
// The server already filters /hospitals to what the signed-in user may see,
// so a roster admin gets exactly their ward while the super admin can switch
// across every hospital. Selection persists per browser.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useMe } from '../api/auth'
import { useHospitals, type Department, type Hospital, type Unit } from '../api/admin'

interface ScopeValue {
  hospitals: Hospital[]
  hospital: Hospital | null
  department: Department | null
  unit: Unit | null
  setHospitalId: (id: string) => void
  setDepartmentId: (id: string) => void
  setUnitId: (id: string) => void
  isLoading: boolean
}

const ScopeContext = createContext<ScopeValue | null>(null)

const STORE_KEY = 'mediroster.scope'

interface Stored {
  hospitalId?: string
  departmentId?: string
  unitId?: string
}

const readStored = (): Stored => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as Stored
  } catch {
    return {}
  }
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { data: me } = useMe()
  const { data: hospitals = [], isLoading } = useHospitals(!!me)
  const [stored, setStored] = useState<Stored>(readStored)

  const value = useMemo<ScopeValue>(() => {
    const hospital = hospitals.find((h) => h.id === stored.hospitalId) ?? hospitals[0] ?? null
    const department =
      hospital?.departments.find((d) => d.id === stored.departmentId) ??
      hospital?.departments[0] ??
      null
    const unit = department?.units.find((u) => u.id === stored.unitId) ?? department?.units[0] ?? null

    const update = (next: Stored) => {
      localStorage.setItem(STORE_KEY, JSON.stringify(next))
      setStored(next)
    }

    return {
      hospitals,
      hospital,
      department,
      unit,
      isLoading,
      // Changing a level resets everything below it to that branch's first node.
      setHospitalId: (id) => update({ hospitalId: id }),
      setDepartmentId: (id) => update({ hospitalId: hospital?.id, departmentId: id }),
      setUnitId: (id) =>
        update({ hospitalId: hospital?.id, departmentId: department?.id, unitId: id }),
    }
  }, [hospitals, stored, isLoading])

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
}

export function useScope(): ScopeValue {
  const ctx = useContext(ScopeContext)
  if (!ctx) throw new Error('useScope must be used inside <ScopeProvider>')
  return ctx
}
