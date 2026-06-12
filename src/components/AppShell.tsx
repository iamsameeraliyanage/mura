import { NavLink, Outlet } from 'react-router-dom'
import type { Role } from '../../shared/types'
import { useMe, useLogout } from '../api/auth'
import { ICON_PATHS, Icon, LogoMark } from './icons'

const NAV_ITEMS: {
  to: string
  label: string
  icon: string
  roles?: Role[]
  mobile?: boolean
}[] = [
  { to: '/', label: 'Dashboard', icon: ICON_PATHS.dashboard, mobile: true },
  {
    to: '/roster/consultant',
    label: 'Consultant roster',
    icon: ICON_PATHS.consultant,
    roles: ['ADMIN', 'CONSULTANT_EDITOR'],
    mobile: true,
  },
  {
    to: '/roster/sho',
    label: 'SHO/RHO roster',
    icon: ICON_PATHS.sho,
    roles: ['ADMIN', 'SHO_EDITOR'],
    mobile: true,
  },
  { to: '/fairness', label: 'Fairness', icon: ICON_PATHS.fairness, mobile: true },
  { to: '/admin/staff', label: 'Staff & config', icon: ICON_PATHS.staff, roles: ['ADMIN'] },
  { to: '/unavailability', label: 'Unavailability', icon: ICON_PATHS.unavail },
  { to: '/audit', label: 'Audit trail', icon: ICON_PATHS.audit },
  { to: '/share', label: 'Share & export', icon: ICON_PATHS.share, mobile: true },
]

const ROLE_CAPTION: Record<Role, string> = {
  ADMIN: 'Sees everything',
  CONSULTANT_EDITOR: 'Consultant roster editor',
  SHO_EDITOR: 'SHO/RHO roster editor',
}

export function AppShell() {
  const { data: me } = useMe()
  const logout = useLogout()

  const items = NAV_ITEMS.filter((i) => !i.roles || (me && i.roles.includes(me.role)))

  return (
    <div className="flex min-h-dvh">
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col border-r border-grid bg-surface md:flex print:hidden">
        <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-1.5">
          <LogoMark />
          <span className="font-display text-[19px] font-semibold tracking-tight">MediRoster</span>
        </div>
        <div className="mr-label px-[18px] pb-4 pl-[54px] text-ink-3">LRH · Paediatrics</div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex h-[38px] items-center gap-[11px] rounded-md px-3 text-[13.5px] whitespace-nowrap transition-colors hover:bg-teal-50 ${
                  isActive ? 'bg-teal-50 font-semibold text-teal-700' : 'font-medium text-ink-2'
                }`
              }
            >
              <Icon d={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {me && (
          <div className="border-t border-grid p-3.5">
            <div className="mr-label mb-2 text-ink-3">Signed in</div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10.5px] font-bold text-teal-700">
                {me.displayName.replace('Dr. ', '').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold">{me.displayName}</span>
                <span className="block text-[10.5px] text-ink-2">{ROLE_CAPTION[me.role]}</span>
              </span>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="mt-2.5 h-8 w-full rounded-md border border-grid bg-surface text-xs font-semibold text-ink-2 hover:bg-sunken"
            >
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-grid bg-surface px-3.5 md:hidden print:hidden">
        <LogoMark size={20} />
        <span className="font-display text-[17px] font-semibold tracking-tight">MediRoster</span>
        <span className="flex-1" />
        {me && (
          <button
            onClick={() => logout.mutate()}
            className="text-xs font-semibold text-ink-2"
            aria-label="Sign out"
          >
            Sign out
          </button>
        )}
      </div>

      <main className="min-w-0 flex-1 pt-12 pb-[72px] md:pt-0 md:pb-0 print:p-0">
        <Outlet />
      </main>

      {/* ── Mobile bottom tabs ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-grid bg-surface px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),10px)] md:hidden print:hidden">
        {items
          .filter((i) => i.mobile)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-[3px] py-1.5 ${
                  isActive ? 'text-teal-700' : 'text-ink-3'
                }`
              }
            >
              <Icon d={item.icon} size={20} />
              <span className="text-[10px] font-semibold">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  )
}
