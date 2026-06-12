import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import type { RosterLayer } from '../../../shared/types'
import { useMe } from '../../api/auth'
import { useHolidays, useHospitals, useStaff } from '../../api/admin'
import {
  useAssignDay,
  useAssignSlot,
  useGenerateRoster,
  usePublishRoster,
  useRoster,
  useSetSecondOnCall,
  useSwapSlots,
  type Slot,
} from '../../api/rosters'
import { MonthGrid } from '../../components/calendar/MonthGrid'
import { FairnessPanel } from '../../components/fairness/FairnessPanel'
import { Button, Dialog, Field, Select } from '../../components/ui'
import { addDays, addMonths, dayOfWeek, monthLabel, todayMonth } from '../../lib/dates'
import { exportRosterImage } from '../../lib/share'

const EDITOR_ROLE: Record<RosterLayer, string> = {
  CONSULTANT: 'CONSULTANT_EDITOR',
  SHO: 'SHO_EDITOR',
}

/** Editors are scoped to their unit; the admin uses the first unit (Phase 1). */
function useUnitId(): string | undefined {
  const { data: me } = useMe()
  const { data: hospitals } = useHospitals(me?.role === 'ADMIN')
  if (me?.unitId) return me.unitId
  return hospitals?.[0]?.departments[0]?.units[0]?.id
}

export default function RosterPage({ layer }: { layer: RosterLayer }) {
  const { data: me } = useMe()
  const unitId = useUnitId()
  const [month, setMonth] = useState(todayMonth())
  const { data, isLoading } = useRoster(unitId, layer, month)
  const generate = useGenerateRoster()
  const publish = usePublishRoster()
  const swap = useSwapSlots()
  const assignDay = useAssignDay()
  const [dayDialog, setDayDialog] = useState<{ date: string; slot: Slot | null } | null>(null)
  const [showViolations, setShowViolations] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [sharing, setSharing] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const exportTitleRef = useRef<HTMLDivElement>(null)

  const shareImage = async () => {
    if (!exportRef.current || !exportTitleRef.current) return
    setSharing(true)
    exportTitleRef.current.classList.remove('hidden') // title bar only on the image
    try {
      await exportRosterImage(exportRef.current, `roster-${layer.toLowerCase()}-${month}.png`)
    } finally {
      exportTitleRef.current.classList.add('hidden')
      setSharing(false)
    }
  }

  const { data: holidayList = [] } = useHolidays(month)
  const holidays = Object.fromEntries(holidayList.map((h) => [h.date.slice(0, 10), h.name]))

  const roster = data?.roster ?? null
  const violations = data?.violations ?? []
  const canEdit = me?.role === 'ADMIN' || me?.role === EDITOR_ROLE[layer]
  const mutationError = (generate.error ?? publish.error ?? swap.error ?? assignDay.error) as {
    response?: { data?: { error?: string } }
  } | null

  const conflictCount = roster?.slots.filter((s) => s.conflictFlag).length ?? 0

  const onDropOnEmpty = (slot: Slot, date: string) => {
    if (!roster) return
    // Dropping onto an empty weekend day (the 5th-weekend "needs decision")
    // assigns that person to BOTH days of the block.
    const dow = dayOfWeek(date)
    if (layer === 'CONSULTANT' && (dow === 6 || dow === 0)) {
      const sat = dow === 6 ? date : addDays(date, -1)
      const sun = addDays(sat, 1)
      assignDay.mutate({
        rosterId: roster.id,
        date: sat,
        staffId: slot.staffId,
        isWeekendBlock: true,
      })
      assignDay.mutate({
        rosterId: roster.id,
        date: sun,
        staffId: slot.staffId,
        isWeekendBlock: true,
      })
    } else {
      assignDay.mutate({ rosterId: roster.id, date, staffId: slot.staffId })
    }
  }

  return (
    <div className="mx-auto max-w-280 px-4 py-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {layer === 'CONSULTANT' ? 'Consultant Roster' : 'SHO Roster'}
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            aria-label="Previous month"
            className="print:hidden"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            ←
          </Button>
          <span className="min-w-32 text-center font-display text-lg">{monthLabel(month)}</span>
          <Button
            variant="ghost"
            aria-label="Next month"
            className="print:hidden"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            →
          </Button>
        </div>
        {roster && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              roster.status === 'PUBLISHED' ? 'bg-ok-bg text-ok' : 'bg-draft-bg text-draft'
            }`}
          >
            {roster.status}
            {roster.version > 1 ? ` v${roster.version}` : ''}
          </span>
        )}
        <div className="ml-auto flex gap-2 print:hidden">
          {roster && (
            <Button variant="ghost" disabled={sharing} onClick={shareImage}>
              {sharing ? 'Exporting…' : 'Share image'}
            </Button>
          )}
          {violations.length > 0 && (
            <Button variant="ghost" onClick={() => setShowViolations(true)} className="text-danger">
              {violations.length} issue{violations.length > 1 ? 's' : ''}
            </Button>
          )}
          {canEdit && unitId && (!roster || roster.status === 'DRAFT') && (
            <Button
              variant={roster ? 'ghost' : 'primary'}
              disabled={generate.isPending}
              onClick={() => generate.mutate({ unitId, layer, month })}
            >
              {generate.isPending ? 'Generating…' : roster ? 'Regenerate' : 'Generate'}
            </Button>
          )}
          {canEdit && roster && (
            <Button disabled={publish.isPending} onClick={() => setConfirmPublish(true)}>
              {roster.status === 'PUBLISHED' ? 'Re-publish' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Banners ── */}
      {mutationError?.response?.data?.error && (
        <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {mutationError.response.data.error}
        </p>
      )}
      {conflictCount > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-warn-bg px-3 py-2 text-sm text-warn">
          <span>
            The consultant roster changed since this was built — {conflictCount} day
            {conflictCount > 1 ? 's' : ''} no longer match.
          </span>
          <Button variant="ghost" onClick={() => setShowViolations(true)}>
            Review conflicts
          </Button>
        </div>
      )}

      {/* ── Body ── */}
      {isLoading ? (
        <p className="mt-8 text-sm text-ink-faint">Loading…</p>
      ) : !roster ? (
        <div className="mt-8 rounded-lg border border-dashed border-grid bg-sheet p-10 text-center">
          <p className="text-ink-soft">
            No {layer.toLowerCase()} roster for {monthLabel(month)} yet.
          </p>
          {canEdit ? (
            <p className="mt-1 text-sm text-ink-faint">
              {layer === 'SHO'
                ? 'Generate one once the consultant roster for this month is published.'
                : 'Generate a draft to get started.'}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-faint">Check back once it has been published.</p>
          )}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div ref={exportRef} className="bg-white">
              <div ref={exportTitleRef} className="hidden px-2 py-3 text-center">
                <span className="font-display text-lg font-semibold">
                  {layer === 'CONSULTANT' ? 'Consultant Roster' : 'SHO Roster'} ·{' '}
                  {monthLabel(month)}
                </span>
                <span className="ml-2 font-mono text-xs text-ink-soft">v{roster.version}</span>
              </div>
              <MonthGrid
                month={month}
                slots={roster.slots}
                violations={violations}
                holidays={holidays}
                canEdit={canEdit}
                onSwap={(a, b) =>
                  swap.mutate({ rosterId: roster.id, slotAId: a.id, slotBId: b.id })
                }
                onDropOnEmpty={onDropOnEmpty}
                onDayClick={(date, slot) => canEdit && setDayDialog({ date, slot })}
              />
            </div>
            <p className="mt-2 text-xs text-ink-faint print:hidden">
              {canEdit
                ? 'Drag a chip onto another day to swap. Tap a day for details.'
                : 'Read-only view.'}
              {layer === 'SHO' && ' ◆ cash · ■ post-cash'}
            </p>
            <p className="hidden font-mono text-xs text-ink-soft print:block">
              Generated by mura · {monthLabel(month)} · v{roster.version}
              {roster.publishedAt &&
                ` · published ${format(new Date(roster.publishedAt), 'd MMM yyyy HH:mm')}`}
            </p>
          </div>
          <div className="print:hidden">
            <FairnessPanel unitId={unitId} layer={layer} roster={roster} />
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      {dayDialog && roster && (
        <DayDialog
          layer={layer}
          unitId={unitId!}
          rosterId={roster.id}
          date={dayDialog.date}
          slot={dayDialog.slot}
          onClose={() => setDayDialog(null)}
        />
      )}
      {confirmPublish && roster && (
        <Dialog
          open
          title={roster.status === 'PUBLISHED' ? 'Re-publish roster?' : 'Publish roster?'}
          onClose={() => setConfirmPublish(false)}
        >
          <p className="text-sm text-ink-soft">
            {roster.status === 'PUBLISHED'
              ? 'Affected dates will be flagged on the SHO roster if cash days moved.'
              : layer === 'CONSULTANT'
                ? 'Publishing unlocks the SHO roster for this month.'
                : 'Publishing finalises this month and advances the weekend rotation.'}
            {violations.length > 0 && (
              <span className="mt-2 block text-danger">
                ⚠ {violations.length} validation issue{violations.length > 1 ? 's are' : ' is'}{' '}
                still open.
              </span>
            )}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmPublish(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                publish.mutate(
                  { rosterId: roster.id },
                  { onSuccess: () => setConfirmPublish(false) },
                )
              }
            >
              {roster.status === 'PUBLISHED' ? 'Re-publish' : 'Publish'}
            </Button>
          </div>
        </Dialog>
      )}
      {showViolations && (
        <Dialog open title="Validation issues" onClose={() => setShowViolations(false)}>
          {violations.length === 0 && conflictCount === 0 ? (
            <p className="text-sm text-ok">All checks pass.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {roster?.slots
                .filter((s) => s.conflictFlag)
                .map((s) => (
                  <li key={s.id} className="rounded-md bg-warn-bg px-3 py-2 text-sm text-warn">
                    {s.conflictReason}
                  </li>
                ))}
              {violations.map((v, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm"
                >
                  <span className="rounded bg-danger px-1 font-mono text-xs text-white">
                    {v.rule}
                  </span>
                  <span className="text-danger">{v.message}</span>
                  {v.date && (
                    <button
                      className="ml-auto text-xs underline"
                      onClick={() => {
                        setShowViolations(false)
                        document
                          .getElementById(`day-${v.date}`)
                          ?.scrollIntoView({ block: 'center' })
                      }}
                    >
                      jump
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Dialog>
      )}
    </div>
  )
}

function DayDialog({
  layer,
  unitId,
  rosterId,
  date,
  slot,
  onClose,
}: {
  layer: RosterLayer
  unitId: string
  rosterId: string
  date: string
  slot: Slot | null
  onClose: () => void
}) {
  const { data: staff = [] } = useStaff(unitId)
  const assignSlot = useAssignSlot()
  const assignDay = useAssignDay()
  const setSecond = useSetSecondOnCall()

  const pool = useMemo(
    () =>
      staff.filter((s) =>
        layer === 'CONSULTANT' ? s.kind === 'CONSULTANT' : s.kind === 'SHO' || s.kind === 'RHO',
      ),
    [staff, layer],
  )
  const [staffId, setStaffId] = useState(slot?.staffId ?? pool[0]?.id ?? '')
  const [secondId, setSecondId] = useState(slot?.secondOnCallId ?? '')

  const save = () => {
    const done = { onSuccess: onClose }
    if (slot && staffId !== slot.staffId) {
      assignSlot.mutate({ rosterId, slotId: slot.id, staffId }, done)
    } else if (!slot && staffId) {
      assignDay.mutate({ rosterId, date, staffId }, done)
    }
    if (slot && layer === 'SHO' && secondId !== (slot.secondOnCallId ?? '')) {
      setSecond.mutate({ rosterId, slotId: slot.id, staffId: secondId || null }, done)
    }
    if (
      slot &&
      staffId === slot.staffId &&
      (layer !== 'SHO' || secondId === (slot.secondOnCallId ?? ''))
    ) {
      onClose()
    }
  }

  return (
    <Dialog open title={date} onClose={onClose}>
      <div className="space-y-3">
        {slot && (
          <p className="text-sm text-ink-soft">
            {slot.staff.fullName}
            {slot.isCash && <span className="ml-2 text-cash">◆ cash</span>}
            {slot.isPostCash && <span className="ml-2 text-postcash">■ post-cash</span>}
            {slot.isWeekendBlock && <span className="ml-2 text-ink-faint">weekend block</span>}
          </p>
        )}
        {slot?.conflictReason && (
          <p className="rounded-md bg-warn-bg px-3 py-2 text-sm text-warn">{slot.conflictReason}</p>
        )}
        <Field label={slot ? 'Assigned to' : 'Assign to'}>
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {pool.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortCode} — {p.fullName}
              </option>
            ))}
          </Select>
        </Field>
        {slot && layer === 'SHO' && (
          <Field label="2nd on-call (transfer duty)">
            <Select value={secondId} onChange={(e) => setSecondId(e.target.value)}>
              <option value="">— none —</option>
              {pool
                .filter((p) => p.id !== staffId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shortCode} — {p.fullName}
                  </option>
                ))}
            </Select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!staffId}>
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
