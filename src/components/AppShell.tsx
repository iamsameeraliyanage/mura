import { NavLink, Outlet } from 'react-router-dom'
import { useMe, useLogout } from '../api/auth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', roles: undefined },
  { to: '/roster/consultant', label: 'Consultant Roster', roles: undefined },
  { to: '/roster/sho', label: 'SHO Roster', roles: undefined },
  { to: '/admin/staff', label: 'Staff', roles: ['ADMIN'] },
  { to: '/admin/settings', label: 'Settings', roles: ['ADMIN'] },
  { to: '/audit', label: 'Audit', roles: undefined },
] as const

export function AppShell() {
  const { data: me } = useMe()
  const logout = useLogout()

  const items = NAV_ITEMS.filter(
    (i) => !i.roles || (me && (i.roles as readonly string[]).includes(me.role)),
  )

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav className="flex shrink-0 items-center justify-between border-b border-grid bg-sheet px-4 py-2 md:w-52 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-3 md:py-6 print:hidden">
        <div className="md:mb-8 md:px-3">
          <span className="font-display text-xl font-semibold tracking-tight">mura</span>
        </div>
        <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block whitespace-nowrap rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500 ${
                    isActive
                      ? 'bg-scrub-50 font-semibold text-scrub-700'
                      : 'text-ink-soft hover:bg-paper hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="md:mt-auto md:px-3">
          {me && (
            <div className="flex items-center gap-2 md:flex-col md:items-stretch">
              <span className="hidden text-xs text-ink-faint md:block">{me.displayName}</span>
              <button
                onClick={() => logout.mutate()}
                className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500 md:mt-1 md:text-left"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
