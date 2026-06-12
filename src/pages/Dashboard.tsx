import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useMe } from '../api/auth'
import { useStaff } from '../api/admin'
import { useAudit, useRoster, type Roster, type Slot } from '../api/rosters'
import { Card, MiniLabel, PenChip, StatusBadge } from '../components/ui'
import { addDays, addMonths, monthLabel, todayMonth } from '../lib/dates'
import { useUnitId } from '../lib/useUnitId'

const today = () => format(new Date(), 'yyyy-MM-dd')

function slotFor(roster: Roster | null | undefined, date: string): Slot | null {
  return roster?.slots.find((s) => s.date.slice(0, 10) === date) ?? null
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { data: me } = useMe()
  const unitId = useUnitId()
  const month = todayMonth()
  const nextMonth = addMonths(month, 1)

  const consultant = useRoster(unitId, 'CONSULTANT', month).data?.roster ?? null
  const sho = useRoster(unitId, 'SHO', month).data?.roster ?? null
  const consultantNext = useRoster(unitId, 'CONSULTANT', nextMonth).data?.roster ?? null
  const shoNext = useRoster(unitId, 'SHO', nextMonth).data?.roster ?? null
  const { data: staff = [] } = useStaff(unitId)
  const { data: audit = [] } = useAudit({ take: 5 })

  const d = today()
  const consToday = slotFor(consultant, d)
  const shoToday = slotFor(sho, d)
  const consTomorrow = slotFor(consultant ?? consultantNext, addDays(d, 1))
  const shoTomorrow = slotFor(sho ?? shoNext, addDays(d, 1))

  // Prof Unit's casualty days drive the SHO cash days — the most useful
  // at-a-glance card for everyone.
  const seat = staff.find((s) => s.isSeat)
  const puDays = (consultant?.slots ?? [])
    .filter((s) => s.staffId === seat?.id)
    .map((s) => ({
      dd: s.date.slice(8, 10),
      weekend: s.isWeekendBlock,
    }))

  const statusCards = [
    { month, layer: 'Consultant roster', roster: consultant, to: '/roster/consultant' },
    { month, layer: 'SHO/RHO roster', roster: sho, to: '/roster/sho' },
    { month: nextMonth, layer: 'Consultant roster', roster: consultantNext, to: '/roster/consultant' },
    { month: nextMonth, layer: 'SHO/RHO roster', roster: shoNext, to: '/roster/sho' },
  ]

  const dotByAction: Record<string, string> = {
    PUBLISH: 'var(--color-published)',
    REPUBLISH: 'var(--color-published)',
    SWAP: 'var(--color-teal-600)',
    CREATE: 'var(--color-draft)',
    UPDATE: 'var(--color-draft)',
    DELETE: 'var(--color-danger)',
  }

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 md:px-7 md:py-[30px]">
      <div className="font-mono text-xs text-ink-2 uppercase">
        {format(new Date(), 'EEEE · MMMM d, yyyy')}
      </div>
      <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
        {greeting()}
        {me ? `, ${me.displayName}` : ''}
      </h1>

      {/* ── Today / tomorrow strip ── */}
      <div className="mt-[22px] grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <MiniLabel className="text-ink-3!">
              Today · {format(new Date(), 'MMM d')}
            </MiniLabel>
            <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.05em] text-teal-700">
              NOW
            </span>
          </div>
          <div className="mt-3.5 flex gap-6">
            <DutySummary
              label={consToday?.isWeekendBlock ? 'Weekend casualty · 48 h' : 'Consultant casualty'}
              slot={consToday}
              shift={
                consToday?.isWeekendBlock
                  ? 'Sat 8:00 am → Mon 8:00 am'
                  : '8:00 am → 8:00 am · 24 h'
              }
            />
            <div className="w-px bg-grid" />
            <DutySummary
              label="SHO/RHO on-call"
              slot={shoToday}
              shift="8:00 am → next day 4:00 pm"
            />
          </div>
        </Card>

        <Card className="p-[18px]">
          <MiniLabel className="text-ink-3!">
            Tomorrow · {format(new Date(Date.now() + 86400000), 'EEE MMM d')}
          </MiniLabel>
          <div className="mt-3.5 flex gap-6">
            <DutySummary
              label={
                consTomorrow?.isWeekendBlock ? 'Weekend casualty · 48 h' : 'Consultant casualty'
              }
              slot={consTomorrow}
              shift={
                consTomorrow?.isWeekendBlock
                  ? 'Sat 8:00 am → Mon 8:00 am'
                  : '8:00 am → 8:00 am · 24 h'
              }
            />
            <div className="w-px bg-grid" />
            <DutySummary
              label="SHO/RHO on-call"
              slot={shoTomorrow}
              shift="8:00 am → next day 4:00 pm"
            />
          </div>
        </Card>
      </div>

      {/* ── Roster status cards ── */}
      <MiniLabel className="mt-[26px] text-ink-3!">Rosters</MiniLabel>
      <div className="mt-2.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((c, i) => (
          <Link key={i} to={c.to}>
            <Card className="h-full p-[15px] transition-colors hover:border-teal-600">
              <div className="font-mono text-[11px] text-ink-2 uppercase">
                {monthLabel(c.month)}
              </div>
              <div className="mt-1 text-sm font-semibold">{c.layer}</div>
              <div className="mt-[11px]">
                {c.roster ? (
                  <StatusBadge status={c.roster.status} />
                ) : (
                  <span className="inline-flex h-6 items-center gap-1.5 rounded bg-sunken px-2 text-[10.5px] font-semibold tracking-[0.04em] text-ink-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-3" />
                    {c.layer.startsWith('SHO') ? 'LOCKED' : 'NOT GENERATED'}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11.5px] leading-snug text-ink-2">
                {c.roster
                  ? `v${c.roster.version}${
                      c.roster.publishedAt
                        ? ` · published ${format(new Date(c.roster.publishedAt), 'MMM d, HH:mm')}`
                        : ' · draft'
                    }`
                  : c.layer.startsWith('SHO')
                    ? 'Unlocks when the consultant roster is published'
                    : 'Generate a draft from the roster screen'}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-[26px] grid grid-cols-1 items-start gap-3.5 lg:grid-cols-2">
        {/* ── Prof Unit days ── */}
        <Card className="p-[18px]">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">
              Prof Unit casualty days — {monthLabel(month)}
            </span>
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              {puDays.length} days
            </span>
          </div>
          {puDays.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-ink-2">No published consultant roster yet.</p>
          ) : (
            <div className="mt-[13px] flex flex-wrap gap-[7px]">
              {puDays.map((p) => (
                <span
                  key={p.dd}
                  className="inline-flex min-w-11 flex-col items-center gap-[3px] rounded-md px-2 pt-[7px] pb-1.5"
                  style={{ backgroundColor: 'var(--color-pen-green-bg)' }}
                >
                  <span className="font-mono text-[12.5px] font-bold text-pen-green">{p.dd}</span>
                  <span className="text-[9px] font-semibold tracking-[0.03em] text-ink-2">
                    {p.weekend ? 'WEEKEND' : 'CASH'}
                  </span>
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11.5px] leading-normal text-ink-2">
            These days set the SHO/RHO cash days. Moving one after the SHO roster is published
            flags the affected dates.
          </p>
        </Card>

        {/* ── Recent activity ── */}
        <Card className="p-[18px]">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Recent activity</span>
            <Link
              to="/audit"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Audit trail
            </Link>
          </div>
          <div className="mt-1.5 flex flex-col">
            {audit.length === 0 && <p className="py-2 text-[12.5px] text-ink-2">No changes yet.</p>}
            {audit.map((a) => (
              <div key={a.id} className="flex gap-[11px] border-b border-grid py-2.5 last:border-0">
                <span
                  className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ backgroundColor: dotByAction[a.action] ?? 'var(--color-ink-3)' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] leading-snug">
                    <strong className="font-semibold">{a.user.displayName}</strong>{' '}
                    {a.action.toLowerCase()} · {a.entity}
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-ink-3">
                    {format(new Date(a.createdAt), 'MMM d, HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function DutySummary({
  label,
  slot,
  shift,
}: {
  label: string
  slot: Slot | null
  shift: string
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-[7px] text-[11px] text-ink-2">{label}</div>
      {slot ? (
        <div className="flex items-center gap-2">
          <PenChip colorKey={slot.staff.colorKey} code={slot.staff.shortCode} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
              {slot.staff.fullName}
              {slot.isCash && (
                <span className="inline-flex h-4 items-center rounded bg-cash-bg px-[5px] text-[9.5px] font-semibold text-cash">
                  ◆ CASH
                </span>
              )}
              {slot.isPostCash && (
                <span className="inline-flex h-4 items-center rounded bg-postcash-bg px-[5px] text-[9.5px] font-semibold text-postcash">
                  ■ POST
                </span>
              )}
            </div>
            <div className="font-mono text-[10.5px] text-ink-2">{shift}</div>
          </div>
        </div>
      ) : (
        <div className="text-[13px] text-ink-3">Not published yet</div>
      )}
    </div>
  )
}
