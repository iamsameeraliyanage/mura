import { NavLink, Outlet } from 'react-router-dom'
import { ROSTER_LAYERS, type Role, type RosterLayer } from '../../shared/types'
import { useMe, useLogout } from '../api/auth'
import { useDutyConfigs } from '../api/admin'
import { useScope } from '../lib/scope'
import { ICON_PATHS, Icon, LogoMark } from './icons'

export const NAV_LAYER_LABELS: Record<RosterLayer, string> = {
  CONSULTANT: 'Consultant roster',
  SHO: 'SHO/RHO roster',
  HO: 'HO roster',
  MO: 'MO roster',
  NURSE: 'Nurses roster',
}

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: Role[]
  mobile?: boolean
}

const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN']

const ROLE_CAPTION: Record<Role, string> = {
  SUPER_ADMIN: 'Sees every hospital',
  HOSPITAL_ADMIN: 'Runs this hospital',
  DEPARTMENT_ADMIN: 'Runs this department',
  ROSTER_ADMIN: 'Roster admin',
}

export function AppShell() {
  const { data: me } = useMe()
  const logout = useLogout()
  const { unit } = useScope()
  const { data: configs = [] } = useDutyConfigs(unit?.id)

  // One nav entry per roster type configured for the selected ward,
  // consultant first. Everyone in scope can open them (read-only enforced
  // per page); only their roster admin and the admins above can edit.
  const rosterItems: NavItem[] = [...configs]
    .sort((a, b) => ROSTER_LAYERS.indexOf(a.layer) - ROSTER_LAYERS.indexOf(b.layer))
    .map((cfg) => ({
      to: `/roster/${cfg.layer.toLowerCase()}`,
      label: NAV_LAYER_LABELS[cfg.layer],
      icon: cfg.layer === 'CONSULTANT' ? ICON_PATHS.consultant : ICON_PATHS.sho,
      mobile: true,
    }))

  const allItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: ICON_PATHS.dashboard, mobile: true },
    ...rosterItems,
    { to: '/fairness', label: 'Fairness', icon: ICON_PATHS.fairness, mobile: true },
    {
      to: '/admin/organisation',
      label: 'Organisation',
      icon: ICON_PATHS.staff,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
    },
    { to: '/admin/staff', label: 'Ward & staff', icon: ICON_PATHS.staff, roles: ADMIN_ROLES },
    { to: '/unavailability', label: 'Unavailability', icon: ICON_PATHS.unavail },
    { to: '/audit', label: 'Audit trail', icon: ICON_PATHS.audit },
    { to: '/share', label: 'Share & export', icon: ICON_PATHS.share, mobile: true },
  ]
  const items = allItems.filter((i) => !i.roles || (me && i.roles.includes(me.role)))

  const caption =
    me?.role === 'ROSTER_ADMIN' && me.rosterLayers.length
      ? `Runs ${me.rosterLayers.map((l) => NAV_LAYER_LABELS[l].replace(' roster', '')).join(', ')}`
      : me
        ? ROLE_CAPTION[me.role]
        : ''

  return (
    <div className="flex min-h-dvh">
      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col border-r border-grid bg-surface md:flex print:hidden">
        <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-1.5">
          <LogoMark />
          <span className="font-display text-[19px] font-semibold tracking-tight">MediRoster</span>
        </div>
        <ScopeSwitcher />
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
                <span className="block text-[10.5px] text-ink-2">{caption}</span>
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
          .slice(0, 5)
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

/** Hospital → department → ward picker. Levels with a single option render as
 *  plain text; levels with choices become dropdowns (the super admin can roam
 *  the whole tree, a department admin only their wards). */
function ScopeSwitcher() {
  const { hospitals, hospital, department, unit, setHospitalId, setDepartmentId, setUnitId } =
    useScope()
  const departments = hospital?.departments ?? []
  const units = department?.units ?? []

  const levels: {
    key: string
    options: { id: string; name: string }[]
    value: string | undefined
    onChange: (id: string) => void
  }[] = [
    { key: 'hospital', options: hospitals, value: hospital?.id, onChange: setHospitalId },
    { key: 'department', options: departments, value: department?.id, onChange: setDepartmentId },
    { key: 'ward', options: units, value: unit?.id, onChange: setUnitId },
  ]

  if (levels.every((l) => l.options.length <= 1)) {
    return (
      <div className="mr-label px-[18px] pb-4 pl-[54px] text-ink-3">
        {[hospital?.name, department?.name].filter(Boolean).join(' · ') || '—'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 px-[18px] pt-1 pb-3.5">
      {levels.map((level) =>
        level.options.length > 1 ? (
          <select
            key={level.key}
            aria-label={level.key}
            value={level.value ?? ''}
            onChange={(e) => level.onChange(e.target.value)}
            className="h-7 w-full rounded border border-grid bg-surface px-1.5 text-[11.5px] font-medium text-ink-2 outline-none hover:border-grid-strong focus-visible:border-teal-600"
          >
            {level.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ) : (
          level.options[0] && (
            <div key={level.key} className="mr-label px-0.5 text-ink-3">
              {level.options[0].name}
            </div>
          )
        ),
      )}
    </div>
  )
}
