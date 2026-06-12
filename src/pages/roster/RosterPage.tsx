import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { RosterLayer } from '../../../shared/types'
import { useMe } from '../../api/auth'
import { useHolidays, useStaff, type Staff } from '../../api/admin'
import {
  useAssignDay,
  useAssignSlot,
  useGenerateRoster,
  usePublishRoster,
  useRoster,
  useSetSecondOnCall,
  useSwapSlots,
  type Roster,
  type Slot,
  type Violation,
} from '../../api/rosters'
import { MonthGrid } from '../../components/calendar/MonthGrid'
import { FairnessPanel, monthTally } from '../../components/fairness/FairnessPanel'
import { Icon, ICON_PATHS } from '../../components/icons'
import { Button, Modal, PenChip, StatusBadge, useToast } from '../../components/ui'
import { addDays, addMonths, dayOfWeek, monthLabel, todayMonth } from '../../lib/dates'
import { useUnitId } from '../../lib/useUnitId'

const EDITOR_ROLE: Record<RosterLayer, string> = {
  CONSULTANT: 'CONSULTANT_EDITOR',
  SHO: 'SHO_EDITOR',
}

const EDITOR_NAME: Record<RosterLayer, string> = {
  CONSULTANT: 'the consultant roster editor',
  SHO: 'the SHO/RHO roster editor',
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function RosterPage({ layer }: { layer: RosterLayer }) {
  const { data: me } = useMe()
  const unitId = useUnitId()
  const toast = useToast()
  const [month, setMonth] = useState(todayMonth())

  const { data, isLoading } = useRoster(unitId, layer, month)
  // Neighbour months feed the tab status dots (cached by React Query).
  const prevMonth = addMonths(month, -1)
  const nextMonth = addMonths(month, 1)
  const prevRoster = useRoster(unitId, layer, prevMonth).data?.roster ?? null
  const nextRoster = useRoster(unitId, layer, nextMonth).data?.roster ?? null
  // The SHO roster unlocks only after the month's consultant roster publishes.
  const consultant = useRoster(unitId, layer === 'SHO' ? 'CONSULTANT' : layer, month).data
  const consultantRoster = layer === 'SHO' ? (consultant?.roster ?? null) : null

  const generate = useGenerateRoster()
  const publish = usePublishRoster()
  const swap = useSwapSlots()
  const assignDay = useAssignDay()
  const assignSlot = useAssignSlot()
  const setSecond = useSetSecondOnCall()
  const { data: staff = [] } = useStaff(unitId)
  const { data: holidayList = [] } = useHolidays(month)
  const holidays = Object.fromEntries(holidayList.map((h) => [h.date.slice(0, 10), h.name]))

  const [spotlight, setSpotlight] = useState<{ id: string; pinned: boolean } | null>(null)
  const [pulseDate, setPulseDate] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [popover, setPopover] = useState<{ date: string; slot: Slot | null } | null>(null)
  const [confirmPublish, setConfirmPublish] = useState(false)

  const roster = data?.roster ?? null
  const violations = data?.violations ?? []
  const canEdit = me?.role === 'ADMIN' || me?.role === EDITOR_ROLE[layer]
  const pool = useMemo(
    () =>
      staff.filter(
        (s) =>
          (layer === 'CONSULTANT' ? s.kind === 'CONSULTANT' : s.kind === 'SHO' || s.kind === 'RHO') &&
          !s.activeUntil,
      ),
    [staff, layer],
  )

  const byDate = useMemo(
    () => new Map((roster?.slots ?? []).map((s) => [s.date.slice(0, 10), s])),
    [roster],
  )
  const conflictSlots = (roster?.slots ?? []).filter((s) => s.conflictFlag)
  const issueCount = violations.length + conflictSlots.length

  // Revalidation: the consultant roster moved on after this SHO roster was built.
  const reval =
    layer === 'SHO' &&
    roster &&
    consultantRoster &&
    roster.builtAgainstVersion != null &&
    consultantRoster.version > roster.builtAgainstVersion
      ? conflictSlots
      : null

  const locked = layer === 'SHO' && !roster && consultantRoster?.status !== 'PUBLISHED'

  const tallies = monthTally(roster, layer)

  const onError = (err: unknown) => {
    const msg =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'That change was rejected — try again'
    toast(msg)
  }

  const isBlockSat = (slot: Slot) => {
    const date = slot.date.slice(0, 10)
    if (dayOfWeek(date) !== 6) return false
    const sun = byDate.get(addDays(date, 1))
    if (!sun || sun.staffId !== slot.staffId) return false
    return (slot.isWeekendBlock && sun.isWeekendBlock) || (!slot.isCash && !sun.isCash)
  }
  const isBlockMember = (slot: Slot) => {
    const date = slot.date.slice(0, 10)
    if (isBlockSat(slot)) return true
    if (dayOfWeek(date) === 0) {
      const sat = byDate.get(addDays(date, -1))
      return !!sat && sat.staffId === slot.staffId && isBlockSat(sat)
    }
    return false
  }

  const onSwap = (a: Slot, b: Slot) => {
    if (!roster) return
    const aBlock = isBlockMember(a)
    const bBlock = isBlockMember(b)
    if (aBlock !== bBlock) {
      toast('Weekend blocks swap with other weekend blocks — drop on a Sat/Sun pill')
      return
    }
    if (aBlock && bBlock) {
      // Swap whole blocks: anchor both to their Saturdays, swap Sat pair + Sun pair.
      const satA = dayOfWeek(a.date.slice(0, 10)) === 6 ? a : byDate.get(addDays(a.date.slice(0, 10), -1))!
      const satB = dayOfWeek(b.date.slice(0, 10)) === 6 ? b : byDate.get(addDays(b.date.slice(0, 10), -1))!
      if (satA.id === satB.id) return
      const sunA = byDate.get(addDays(satA.date.slice(0, 10), 1))!
      const sunB = byDate.get(addDays(satB.date.slice(0, 10), 1))!
      swap.mutate(
        { rosterId: roster.id, slotAId: satA.id, slotBId: satB.id },
        {
          onError,
          onSuccess: () =>
            swap.mutate(
              { rosterId: roster.id, slotAId: sunA.id, slotBId: sunB.id },
              {
                onError,
                onSuccess: () =>
                  toast(
                    `Weekend blocks swapped — ${satA.staff.shortCode} ⇄ ${satB.staff.shortCode}`,
                  ),
              },
            ),
        },
      )
      return
    }
    swap.mutate(
      { rosterId: roster.id, slotAId: a.id, slotBId: b.id },
      {
        onError,
        onSuccess: () =>
          toast(
            `${format(new Date(a.date), 'MMM d')} ⇄ ${format(new Date(b.date), 'MMM d')} — ${
              layer === 'SHO' ? 'flags stay with the day, ' : ''
            }tallies updated`,
          ),
      },
    )
  }

  const onDropOnEmpty = (slot: Slot, date: string) => {
    if (!roster) return
    const dow = dayOfWeek(date)
    if (layer === 'CONSULTANT' && (dow === 6 || dow === 0)) {
      // Empty weekend day (the 5th-weekend "needs decision") → assign the block.
      const sat = dow === 6 ? date : addDays(date, -1)
      const sun = addDays(sat, 1)
      assignDay.mutate(
        { rosterId: roster.id, date: sat, staffId: slot.staffId, isWeekendBlock: true },
        { onError },
      )
      assignDay.mutate(
        { rosterId: roster.id, date: sun, staffId: slot.staffId, isWeekendBlock: true },
        {
          onError,
          onSuccess: () => toast(`${slot.staff.shortCode} takes the weekend block`),
        },
      )
    } else {
      assignDay.mutate(
        { rosterId: roster.id, date, staffId: slot.staffId },
        { onError, onSuccess: () => toast(`${slot.staff.shortCode} assigned to ${date}`) },
      )
    }
  }

  const jumpToDay = (date: string) => {
    setDrawerOpen(false)
    setPulseDate(date)
    document.getElementById(`day-${date}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => setPulseDate(null), 1100)
  }

  const monthTabs = [
    { key: prevMonth, roster: prevRoster },
    { key: month, roster },
    { key: nextMonth, roster: nextRoster },
  ]

  let metaLine = ''
  if (roster) {
    const cashDays = roster.slots.filter((s) => s.isCash).map((s) => Number(s.date.slice(8, 10)))
    metaLine =
      layer === 'SHO'
        ? `${roster.slots.length} days · cash locked to Pu: ${cashDays.join(', ') || '—'}`
        : `${roster.slots.length} days · ${
            roster.slots.filter((s) => s.isWeekendBlock && dayOfWeek(s.date.slice(0, 10)) === 6)
              .length
          } weekend blocks`
    metaLine +=
      roster.status === 'PUBLISHED'
        ? ` · published ${roster.publishedAt ? format(new Date(roster.publishedAt), 'MMM d, HH:mm') : ''} · v${roster.version}`
        : ` · draft v${roster.version}${issueCount ? ` · ${issueCount} conflict${issueCount > 1 ? 's' : ''} to resolve` : ' · no conflicts'}`
    if (layer === 'SHO' && roster.builtAgainstVersion != null)
      metaLine += ` · built against consultant v${roster.builtAgainstVersion}`
  }

  return (
    <div className="flex min-h-full flex-col">
      {!canEdit && (
        <div className="flex items-center gap-2 border-b border-grid bg-sunken px-4 py-2 text-[12.5px] text-ink-2 md:px-7 print:hidden">
          <Icon d={ICON_PATHS.lock} size={14} />
          Read-only — this roster is edited by {EDITOR_NAME[layer]}.
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex flex-wrap items-end gap-4 px-4 pt-5 pb-4 md:px-7 md:pt-[26px] print:hidden">
        <div className="min-w-0 flex-1">
          <div className="mr-label mb-1.5 flex flex-wrap items-center gap-2.5 text-ink-2">
            {layer === 'CONSULTANT' ? 'Consultant casualty roster' : 'SHO/RHO on-call roster'}
            {roster && <StatusBadge status={roster.status} version={roster.version} />}
          </div>
          <h1 className="font-display text-[32px] leading-[1.05] font-semibold tracking-tight md:text-[40px]">
            {monthLabel(month)}
          </h1>
          {metaLine && <div className="mt-1.5 font-mono text-xs text-ink-2">{metaLine}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-1">
          <div className="flex gap-0.5 rounded-md border border-grid bg-surface p-[3px]">
            {monthTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setMonth(t.key)}
                className={`inline-flex h-[30px] items-center gap-[7px] rounded px-3 text-[13px] transition-colors ${
                  t.key === month
                    ? 'bg-teal-50 font-semibold text-ink'
                    : 'font-medium text-ink-2 hover:bg-sunken'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      t.roster?.status === 'PUBLISHED'
                        ? 'var(--color-published)'
                        : t.roster
                          ? 'var(--color-draft)'
                          : 'var(--color-grid-strong)',
                  }}
                />
                {monthLabel(t.key).slice(0, 3)}
              </button>
            ))}
          </div>
          {canEdit && roster && roster.status === 'DRAFT' && (
            <Button
              variant="ghost"
              disabled={generate.isPending}
              onClick={() => generate.mutate({ unitId: unitId!, layer, month }, { onError })}
            >
              {generate.isPending ? 'Generating…' : 'Regenerate'}
            </Button>
          )}
          {canEdit && roster && (
            <Button disabled={publish.isPending} onClick={() => setConfirmPublish(true)}>
              {roster.status === 'PUBLISHED' ? 'Re-publish' : 'Publish'}
            </Button>
          )}
        </div>
      </header>

      {/* ── Revalidation banner (consultant re-published under this roster) ── */}
      {reval && reval.length > 0 && (
        <div className="mx-4 mb-3.5 rounded-lg border border-[#ecd9b8] bg-cash-bg px-4 py-3 md:mx-7 print:hidden">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-semibold text-cash">
              Consultant roster re-published — v{consultantRoster!.version}
            </span>
            <span className="flex-1" />
            <span className="font-mono text-[11.5px] text-cash uppercase">
              Built against v{roster!.builtAgainstVersion} · {reval.length} day
              {reval.length > 1 ? 's' : ''} need review
            </span>
          </div>
          <div className="mt-2.5 flex flex-col gap-[5px]">
            {reval.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => jumpToDay(s.date.slice(0, 10))}
                  className="rounded border border-[#ecd9b8] bg-surface px-[7px] py-[3px] font-mono text-[11px] font-bold text-cash uppercase hover:border-cash"
                >
                  {format(new Date(s.date), 'MMM dd')}
                </button>
                <span className="text-[12.5px]">{s.conflictReason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conflict bar + drawer ── */}
      {roster && violations.length > 0 && (
        <div className="mx-4 mb-3.5 md:mx-7 print:hidden">
          <div className="flex items-center gap-2.5 rounded-lg border border-[#f2c8c8] bg-danger-bg px-3.5 py-2">
            <span className="text-[13px] font-semibold text-danger">
              ⚠ {violations.length} conflict{violations.length > 1 ? 's' : ''} on this roster
            </span>
            <span className="flex-1" />
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="text-[12.5px] font-semibold text-danger underline underline-offset-[3px]"
            >
              {drawerOpen ? 'Hide' : 'Review'}
            </button>
          </div>
          {drawerOpen && (
            <div className="mt-1.5 overflow-hidden rounded-lg border border-grid bg-surface shadow-(--shadow-sm)">
              {violations.map((v, i) => (
                <ViolationRow key={i} violation={v} onJump={jumpToDay} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-col gap-[18px] px-4 pb-7 md:px-7 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-ink-3">Loading…</p>
          ) : locked ? (
            <div className="rounded-lg border border-grid bg-surface px-8 py-[72px] text-center shadow-(--shadow-xs)">
              <div className="mb-3.5 flex justify-center text-ink-3">
                <Icon d={ICON_PATHS.lock} size={34} />
              </div>
              <div className="font-display text-[26px] font-semibold">
                {monthLabel(month)} is locked until the consultant roster is published
              </div>
              <p className="mx-auto mt-2.5 max-w-[460px] text-sm leading-normal text-ink-2">
                Cash days mirror Prof Unit's casualty days, so this roster waits for the
                consultant editor to publish {monthLabel(month)}.
              </p>
            </div>
          ) : !roster ? (
            <div className="rounded-lg border border-grid bg-surface px-8 py-16 text-center shadow-(--shadow-xs)">
              <div className="font-display text-[26px] font-semibold">
                {monthLabel(month)} has no roster yet
              </div>
              <p className="mx-auto mt-2.5 max-w-[480px] text-sm leading-normal text-ink-2">
                {layer === 'CONSULTANT'
                  ? 'The generator balances the month across the consultants — 7–8 days each, one weekend block each, no back-to-back duties — and checks the previous month’s tail.'
                  : 'The generator balances on-call, cash and post-cash separately, locks cash days to Prof Unit’s casualty days, and carries the weekend rotation across months.'}
              </p>
              {canEdit && unitId && (
                <div className="mt-5">
                  <Button
                    disabled={generate.isPending}
                    onClick={() => generate.mutate({ unitId, layer, month }, { onError })}
                  >
                    {generate.isPending
                      ? 'Generating…'
                      : `Generate ${monthLabel(month).split(' ')[0]}`}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Legend / person spotlight */}
              <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
                {pool.map((p) => (
                  <LegendButton
                    key={p.id}
                    staff={p}
                    layer={layer}
                    tally={tallies[p.id]}
                    pinned={spotlight?.pinned === true && spotlight.id === p.id}
                    onEnter={() =>
                      setSpotlight((s) => (s?.pinned ? s : { id: p.id, pinned: false }))
                    }
                    onLeave={() => setSpotlight((s) => (s?.pinned ? s : null))}
                    onClick={() =>
                      setSpotlight((s) =>
                        s?.pinned && s.id === p.id ? null : { id: p.id, pinned: true },
                      )
                    }
                  />
                ))}
                <span className="flex-1" />
                <span className="hidden text-[11.5px] text-ink-3 xl:inline">
                  {canEdit
                    ? 'Hover a person to spotlight their days · drag chips to swap · click a day for details'
                    : 'Hover a person to spotlight their days · click a day for details'}
                </span>
                {layer === 'SHO' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-2">
                    <span className="inline-flex h-[17px] items-center rounded bg-cash-bg px-1.5 text-[10px] font-semibold text-cash">
                      ◆ CASH
                    </span>
                    <span className="inline-flex h-[17px] items-center rounded bg-postcash-bg px-1.5 text-[10px] font-semibold text-postcash">
                      ■ POST
                    </span>
                  </span>
                )}
              </div>

              <MonthGrid
                month={month}
                layer={layer}
                slots={roster.slots}
                violations={violations}
                holidays={holidays}
                canEdit={canEdit}
                spotlightId={spotlight?.id ?? null}
                pulseDate={pulseDate}
                onSwap={onSwap}
                onDropOnEmpty={onDropOnEmpty}
                onDayClick={(date, slot) => setPopover({ date, slot })}
              />
              <p className="mt-2 hidden font-mono text-xs text-ink-2 print:block">
                Generated by MediRoster · {monthLabel(month)} · v{roster.version}
                {roster.publishedAt &&
                  ` · published ${format(new Date(roster.publishedAt), 'MMM d, yyyy HH:mm')}`}
              </p>
            </>
          )}
        </div>

        {roster && (
          <FairnessPanel unitId={unitId} layer={layer} roster={roster} month={month} />
        )}
      </div>

      {/* ── Day popover (modal on mobile-size, anchored feel via center) ── */}
      {popover && roster && (
        <DayModal
          layer={layer}
          roster={roster}
          date={popover.date}
          slot={popover.slot}
          pool={pool}
          violations={violations}
          canEdit={canEdit}
          onClose={() => setPopover(null)}
          onAssign={(staffId) => {
            const done = {
              onError,
              onSuccess: () => {
                setPopover(null)
                toast('Reassigned — tallies updated')
              },
            }
            if (popover.slot)
              assignSlot.mutate({ rosterId: roster.id, slotId: popover.slot.id, staffId }, done)
            else assignDay.mutate({ rosterId: roster.id, date: popover.date, staffId }, done)
          }}
          onSetSecond={(staffId) => {
            if (!popover.slot) return
            setSecond.mutate(
              { rosterId: roster.id, slotId: popover.slot.id, staffId },
              {
                onError,
                onSuccess: () => {
                  setPopover(null)
                  toast(staffId ? '2nd on-call updated' : '2nd on-call cleared')
                },
              },
            )
          }}
        />
      )}

      {/* ── Publish confirm ── */}
      {roster && (
        <Modal
          open={confirmPublish}
          onClose={() => setConfirmPublish(false)}
          title={`${roster.status === 'PUBLISHED' ? 'Re-publish' : 'Publish'} ${monthLabel(month)}?`}
        >
          <p className="text-[13.5px] leading-normal text-ink-2">
            v{roster.version} → v{roster.version + 1} · Locks this version, writes the audit
            trail
            {layer === 'CONSULTANT'
              ? ' and flags affected dates on the SHO/RHO roster if cash days moved.'
              : ' and advances the weekend rotation.'}{' '}
            You can edit and re-publish anytime.
          </p>
          {issueCount > 0 && (
            <p className="mt-2.5 rounded-md bg-cash-bg px-3 py-2 text-[12.5px] leading-snug text-cash">
              {issueCount} conflict{issueCount > 1 ? 's are' : ' is'} still unresolved — they will
              stay flagged after publishing.
            </p>
          )}
          <div className="mt-[18px] flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmPublish(false)}>
              Cancel
            </Button>
            <Button
              disabled={publish.isPending}
              onClick={() =>
                publish.mutate(
                  { rosterId: roster.id },
                  {
                    onError,
                    onSuccess: (d) => {
                      setConfirmPublish(false)
                      toast(
                        `${monthLabel(month)} ${layer === 'CONSULTANT' ? 'consultant' : 'SHO/RHO'} roster published — v${d.roster?.version ?? roster.version + 1}`,
                      )
                    },
                  },
                )
              }
            >
              {roster.status === 'PUBLISHED' ? 'Re-publish' : 'Publish'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ViolationRow({
  violation,
  onJump,
}: {
  violation: Violation
  onJump: (date: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-grid px-3.5 py-2.5 last:border-0">
      <span className="rounded bg-danger-bg px-1.5 py-[3px] font-mono text-[10.5px] font-bold text-danger">
        {violation.rule}
      </span>
      <span className="flex-1 text-[13px]">{violation.message}</span>
      {violation.date && (
        <button
          onClick={() => onJump(violation.date!)}
          className="rounded border border-grid bg-surface px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
        >
          Jump to day
        </button>
      )}
    </div>
  )
}

function LegendButton({
  staff,
  layer,
  tally,
  pinned,
  onEnter,
  onLeave,
  onClick,
}: {
  staff: Staff
  layer: RosterLayer
  tally?: Record<string, number>
  pinned: boolean
  onEnter: () => void
  onLeave: () => void
  onClick: () => void
}) {
  const t = tally ?? {}
  const line =
    layer === 'CONSULTANT'
      ? `${pad(t.days ?? 0)} days · ${t.weekendBlocks ?? 0} wkd`
      : `${pad(t.onCalls ?? 0)} oc · ${t.cash ?? 0}◆ · ${t.postCash ?? 0}■`
  return (
    <button
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md border bg-surface py-1.5 pr-2.5 pl-2 shadow-(--shadow-xs) transition-colors ${
        pinned ? 'border-teal-600' : 'border-grid hover:border-grid-strong'
      }`}
    >
      <PenChip colorKey={staff.colorKey} code={staff.shortCode} size="sm" />
      <span className="text-left">
        <span className="block text-xs leading-tight font-semibold whitespace-nowrap">
          {staff.isSeat && staff.currentHolder
            ? `${staff.fullName} · ${staff.currentHolder}`
            : staff.fullName}
        </span>
        <span className="block font-mono text-[10.5px] leading-snug whitespace-nowrap text-ink-2">
          {line}
        </span>
      </span>
    </button>
  )
}

function DayModal({
  layer,
  roster,
  date,
  slot,
  pool,
  violations,
  canEdit,
  onClose,
  onAssign,
  onSetSecond,
}: {
  layer: RosterLayer
  roster: Roster
  date: string
  slot: Slot | null
  pool: Staff[]
  violations: Violation[]
  canEdit: boolean
  onClose: () => void
  onAssign: (staffId: string) => void
  onSetSecond: (staffId: string | null) => void
}) {
  const weekendBlock = slot?.isWeekendBlock
  const dayIssues = violations.filter((v) => v.date === date).map((v) => v.message)
  if (slot?.conflictReason) dayIssues.push(slot.conflictReason)

  const flags: string[] = []
  if (slot?.isCash)
    flags.push('◆ Cash day — Pu is on consultant casualty; same 32 h shift.')
  if (slot?.isPostCash)
    flags.push(
      '■ Post-cash — stays 8 am – 4 pm, hands over, may leave early with consultant’s permission.',
    )

  const shift =
    layer === 'CONSULTANT'
      ? weekendBlock
        ? 'Weekend casualty · Sat 8:00 am → Mon 8:00 am · 48 h'
        : 'Weekday casualty · 8:00 am → next day 8:00 am · 24 h'
      : 'On-call · 8:00 am → next day 4:00 pm · 32 h'

  return (
    <Modal
      open
      onClose={onClose}
      title={format(new Date(`${date}T00:00:00Z`), 'EEE · MMM dd, yyyy')}
      width="w-[320px]"
    >
      <div className="flex items-center gap-2.5">
        {slot ? (
          <PenChip colorKey={slot.staff.colorKey} code={slot.staff.shortCode} size="md" />
        ) : (
          <span className="inline-flex h-7 min-w-8 items-center justify-center rounded-md bg-sunken px-2 text-sm font-semibold text-ink-2">
            —
          </span>
        )}
        <div>
          <div className="text-sm font-semibold">{slot ? slot.staff.fullName : 'Unassigned'}</div>
          <div className="font-mono text-[11px] text-ink-2">{shift}</div>
        </div>
      </div>

      {flags.length > 0 && (
        <p className="mt-2.5 text-xs leading-normal text-ink-2">{flags.join(' ')}</p>
      )}

      {layer === 'SHO' && slot && (
        <div className="mt-2.5 rounded-md bg-sunken px-2.5 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-ink-2 uppercase">
              2nd on-call · transfer
            </span>
            <span className="flex-1" />
            {slot.secondOnCall ? (
              <PenChip
                colorKey={slot.secondOnCall.colorKey}
                code={slot.secondOnCall.shortCode}
                size="sm"
              />
            ) : (
              <span className="text-xs text-ink-3">—</span>
            )}
          </div>
          {canEdit && (
            <div className="mt-2 flex gap-1.5">
              {pool
                .filter((p) => p.id !== slot.staffId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSetSecond(p.id === slot.secondOnCallId ? null : p.id)}
                    className={`flex h-[26px] flex-1 items-center justify-center rounded-md border text-xs font-semibold ${
                      p.id === slot.secondOnCallId
                        ? 'border-teal-600'
                        : 'border-grid hover:border-teal-600'
                    }`}
                    style={{
                      color: `var(--color-${p.colorKey})`,
                      backgroundColor: `var(--color-${p.colorKey}-bg)`,
                    }}
                  >
                    {p.shortCode}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {dayIssues.length > 0 && (
        <p className="mt-2.5 rounded-md bg-danger-bg px-2.5 py-2 text-xs leading-snug text-danger">
          {dayIssues.join(' · ')}
        </p>
      )}

      {canEdit && roster && !weekendBlock && (
        <div className="mt-3 border-t border-grid pt-2.5">
          <div className="mr-label mb-[7px] text-ink-3">Reassign to</div>
          <div className="flex gap-1.5">
            {pool
              .filter((p) => p.id !== slot?.staffId)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => onAssign(p.id)}
                  className="flex h-[30px] flex-1 items-center justify-center rounded-md border border-grid text-[13px] font-semibold hover:border-teal-600"
                  style={{
                    color: `var(--color-${p.colorKey})`,
                    backgroundColor: `var(--color-${p.colorKey}-bg)`,
                  }}
                >
                  {p.shortCode}
                </button>
              ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
