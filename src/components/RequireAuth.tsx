import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '../../shared/types'
import { useMe } from '../api/auth'

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { data: me, isLoading } = useMe()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-faint">
        Loading…
      </div>
    )
  }
  if (!me) return <Navigate to="/login" replace />
  if (roles && !roles.includes(me.role)) return <Navigate to="/" replace />
  return <Outlet />
}
