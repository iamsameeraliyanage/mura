// The heart of the app — a Mon–Sun month grid of pen-colored DutyChips:
// weekend-block pills span Sat+Sun, cash ◆ / post-cash ■ flags sit under the
// chip, conflicts ring the chip in red, and dnd-kit handles swap drags.
import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { RosterLayer } from '../../../shared/types'
import type { Slot, Violation } from '../../api/rosters'
import { addDays, dayOfWeek, monthGridRows } from '../../lib/dates'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export interface MonthGridProps {
  month: string
  layer: RosterLayer
  slots: Slot[]
  violations: Violation[]
  /** date (YYYY-MM-DD) → holiday name */
  holidays?: Record<string, string>
  canEdit: boolean
  /** staffId to spotlight — everyone else's chips dim to 18% */
  spotlightId?: string | null
  /** date pulsing after a "jump to day" */
  pulseDate?: string | null
  onSwap: (a: Slot, b: Slot) => void
  onDropOnEmpty: (slot: Slot, date: string) => void
  onDayClick: (date: string, slot: Slot | null) => void
}

/** Sat-anchored 2-day block: consultant weekend or SHO non-cash weekend. */
function blockPillFor(slot: Slot, byDate: Map<string, Slot>): { hours: string } | null {
  const date = slot.date.slice(0, 10)
  if (dayOfWeek(date) !== 6) return null
  const sun = byDate.get(addDays(date, 1))
  if (!sun || sun.staffId !== slot.staffId) return null
  if (slot.isWeekendBlock && sun.isWeekendBlock) return { hours: '48 H' }
  if (!slot.isCash && !sun.isCash) return { hours: '2 OC' } // SHO non-cash weekend
  return null
}

function isBlockMember(slot: Slot | null, byDate: Map<string, Slot>): boolean {
  if (!slot) return false
  const date = slot.date.slice(0, 10)
  if (dayOfWeek(date) === 6) return !!blockPillFor(slot, byDate)
  if (dayOfWeek(date) === 0) {
    const sat = byDate.get(addDays(date, -1))
    return !!sat && !!blockPillFor(sat, byDate) && sat.staffId === slot.staffId
  }
  return false
}

export function MonthGrid(props: MonthGridProps) {
  const byDate = new Map(props.slots.map((s) => [s.date.slice(0, 10), s]))
  const violationDates = new Set(props.violations.filter((v) => v.date).map((v) => v.date))
  const [dragging, setDragging] = useState<Slot | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setDragging(props.slots.find((s) => s.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(null)
    const { active, over } = event
    if (!over) return
    const from = props.slots.find((s) => s.id === active.id)
    if (!from) return
    const targetDate = String(over.id)
    if (from.date.slice(0, 10) === targetDate) return
    const target = byDate.get(targetDate)
    if (target) props.onSwap(from, target)
    else props.onDropOnEmpty(from, targetDate)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="overflow-hidden rounded-lg border border-grid bg-surface shadow-(--shadow-xs)">
        <div className="grid grid-cols-7 border-b border-grid">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`border-r border-grid px-1.5 py-2 text-center text-[11px] font-semibold tracking-[0.04em] last:border-r-0 md:px-2.5 md:text-left ${
                i >= 5 ? 'bg-weekend-bg text-ink-2' : 'text-ink-3'
              }`}
            >
              <span className="md:hidden">{d[0]}</span>
              <span className="hidden md:inline">{d}</span>
            </div>
          ))}
        </div>
        {monthGridRows(props.month).map((row, i) => (
          <div key={i} className="grid grid-cols-7">
            {row.map((date, j) =>
              date ? (
                <DayCell
                  key={date}
                  date={date}
                  layer={props.layer}
                  slot={byDate.get(date) ?? null}
                  byDate={byDate}
                  isToday={date === today}
                  hasViolation={violationDates.has(date)}
                  holiday={props.holidays?.[date]}
                  canEdit={props.canEdit}
                  spotlightId={props.spotlightId ?? null}
                  pulsing={props.pulseDate === date}
                  draggingId={dragging?.id ?? null}
                  onClick={() => props.onDayClick(date, byDate.get(date) ?? null)}
                />
              ) : (
                <div
                  key={`pad-${i}-${j}`}
                  className="min-h-14 border-r border-b border-grid bg-sunken last:border-r-0 md:min-h-24"
                />
              ),
            )}
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {dragging ? (
          <span
            className="inline-flex h-[30px] min-w-9 scale-105 items-center justify-center rounded-md px-2.5 text-[15px] font-semibold shadow-(--shadow-lift)"
            style={{
              color: `var(--color-${dragging.staff.colorKey})`,
              backgroundColor: `var(--color-${dragging.staff.colorKey}-bg)`,
              boxShadow: 'var(--shadow-lift), 0 0 0 2px var(--color-teal-600)',
            }}
          >
            {dragging.staff.shortCode}
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function DayCell({
  date,
  layer,
  slot,
  byDate,
  isToday,
  hasViolation,
  holiday,
  canEdit,
  spotlightId,
  pulsing,
  draggingId,
  onClick,
}: {
  date: string
  layer: RosterLayer
  slot: Slot | null
  byDate: Map<string, Slot>
  isToday: boolean
  hasViolation: boolean
  holiday?: string
  canEdit: boolean
  spotlightId: string | null
  pulsing: boolean
  draggingId: string | null
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date, disabled: !canEdit })
  const dow = dayOfWeek(date)
  const weekend = dow === 0 || dow === 6
  const dd = date.slice(8, 10)
  const conflict = hasViolation || !!slot?.conflictFlag
  const review = !!slot?.conflictFlag && !!slot.conflictReason
  const pill = slot ? blockPillFor(slot, byDate) : null
  const inBlock = isBlockMember(slot, byDate)
  const isSunOfBlock = inBlock && dow === 0
  const dimmed = !!spotlightId && (!slot || slot.staffId !== spotlightId)
  const dragSrc = !!slot && slot.id === draggingId
  // Cash weekend day tag (Sat/Sun split between two people)
  const cashWkd = slot?.isCash && weekend

  const tint = holiday ? 'bg-holiday-bg' : weekend ? 'bg-weekend-bg' : 'bg-surface'

  return (
    <div
      ref={setNodeRef}
      id={`day-${date}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`relative flex min-h-14 cursor-pointer flex-col border-r border-b border-grid p-1 transition-colors last:border-r-0 md:min-h-[96px] md:p-2 ${tint} ${
        isOver ? 'bg-teal-50!' : ''
      } ${pulsing ? 'mr-pulse' : ''}`}
      style={
        isOver
          ? { boxShadow: 'inset 0 0 0 2px var(--color-teal-600)' }
          : isToday
            ? { boxShadow: 'inset 0 0 0 2px var(--color-teal-600)' }
            : undefined
      }
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={`font-mono text-xs ${isToday ? 'font-bold text-teal-700' : 'text-ink-3'}`}
        >
          {dd}
        </span>
        <span className="flex items-center gap-1">
          {layer === 'SHO' && slot?.isCash && (
            <span
              title="Prof Unit on consultant casualty"
              className="hidden rounded px-[5px] py-0.5 font-mono text-[9.5px] font-semibold md:inline"
              style={{
                color: 'var(--color-pen-green)',
                backgroundColor: 'var(--color-pen-green-bg)',
              }}
            >
              Pu
            </span>
          )}
          {isToday ? (
            <span className="hidden rounded bg-teal-50 px-[5px] py-0.5 text-[9px] font-bold tracking-[0.05em] text-teal-700 md:inline">
              TODAY
            </span>
          ) : holiday ? (
            <span
              title={holiday}
              className="max-w-full truncate rounded px-[5px] py-0.5 text-[9px] font-bold tracking-[0.05em] text-danger"
            >
              PH<span className="hidden md:inline"> · {holiday.toUpperCase()}</span>
            </span>
          ) : cashWkd && layer === 'SHO' ? (
            <span className="hidden rounded bg-cash-bg px-[5px] py-0.5 text-[9px] font-bold tracking-[0.05em] text-cash md:inline">
              CASH WKD
            </span>
          ) : null}
        </span>
      </div>

      {/* Sat-anchored weekend pill spanning both cells */}
      {pill && slot && (
        <DraggablePill
          slot={slot}
          hours={pill.hours}
          layer={layer}
          canEdit={canEdit}
          conflict={conflict}
          dimmed={dimmed}
          dragSrc={dragSrc}
        />
      )}

      {/* Centered chip (non-block days, and cash-weekend split days) */}
      {slot && !inBlock && (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-[3px] transition-opacity ${
            dimmed ? 'opacity-[0.18]' : dragSrc ? 'opacity-35' : ''
          }`}
        >
          <DraggableChip slot={slot} canEdit={canEdit} conflict={conflict} />
          <span className="hidden max-w-full truncate text-[10.5px] text-ink-2 md:inline">
            {slot.staff.fullName.replace('Dr. ', '')}
          </span>
          {slot.secondOnCall && (
            <span
              title={`2nd on-call · transfer: ${slot.secondOnCall.fullName}`}
              className="hidden h-[18px] items-center rounded-md border border-dashed bg-surface px-[7px] text-[10px] font-semibold md:inline-flex"
              style={{
                color: `var(--color-${slot.secondOnCall.colorKey})`,
                borderColor: `var(--color-${slot.secondOnCall.colorKey}-dot)`,
              }}
            >
              2nd · {slot.secondOnCall.shortCode}
            </span>
          )}
        </div>
      )}

      {/* Unassigned day */}
      {!slot && (
        <div className="flex flex-1 items-center justify-center">
          <span className="rounded-md border border-dashed border-grid-strong px-2 py-1 font-mono text-[11px] text-ink-3 md:px-2.5 md:py-1.5">
            —
          </span>
        </div>
      )}

      {/* Flags row */}
      {slot && (slot.isCash || slot.isPostCash || conflict) && (
        <div className="flex min-h-[18px] flex-wrap items-center gap-1">
          {slot.isCash && (
            <span className="inline-flex h-[18px] items-center rounded bg-cash-bg px-1.5 text-[10px] font-semibold text-cash">
              ◆<span className="hidden md:inline">&nbsp;{cashWkd ? (dow === 6 ? 'SAT' : 'SUN') : 'CASH'}</span>
            </span>
          )}
          {slot.isPostCash && (
            <span className="inline-flex h-[18px] items-center rounded bg-postcash-bg px-1.5 text-[10px] font-semibold text-postcash">
              ■<span className="hidden md:inline">&nbsp;POST</span>
            </span>
          )}
          {conflict && !isSunOfBlock && (
            <span
              title={slot.conflictReason ?? undefined}
              className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[10px] font-semibold ${
                review
                  ? 'border border-dashed border-cash bg-surface text-cash'
                  : 'bg-danger-bg text-danger'
              }`}
            >
              {review ? 'REVIEW' : '⚠'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function DraggableChip({
  slot,
  canEdit,
  conflict,
}: {
  slot: Slot
  canEdit: boolean
  conflict: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: slot.id,
    disabled: !canEdit,
  })
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ touchAction: 'none' }}
      onClick={(e) => e.stopPropagation()}
      className={canEdit ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <span
        key={slot.staffId}
        title={slot.staff.fullName}
        className={`mr-chip-in inline-flex h-[22px] min-w-[26px] items-center justify-center rounded-md px-1.5 text-xs leading-none font-semibold md:h-[30px] md:min-w-9 md:px-2.5 md:text-[15px] ${
          isDragging ? 'opacity-30' : ''
        }`}
        style={{
          color: `var(--color-${slot.staff.colorKey})`,
          backgroundColor: `var(--color-${slot.staff.colorKey}-bg)`,
          boxShadow: conflict
            ? '0 0 0 2px var(--color-danger)'
            : '0 1px 1px rgba(27,39,51,0.05)',
        }}
      >
        {slot.staff.shortCode}
      </span>
    </span>
  )
}

function DraggablePill({
  slot,
  hours,
  layer,
  canEdit,
  conflict,
  dimmed,
  dragSrc,
}: {
  slot: Slot
  hours: string
  layer: RosterLayer
  canEdit: boolean
  conflict: boolean
  dimmed: boolean
  dragSrc: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: slot.id,
    disabled: !canEdit,
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => e.stopPropagation()}
      style={{
        touchAction: 'none',
        color: `var(--color-${slot.staff.colorKey})`,
        backgroundColor: `var(--color-${slot.staff.colorKey}-bg)`,
        boxShadow: conflict ? '0 0 0 2px var(--color-danger)' : 'var(--shadow-xs)',
      }}
      className={`absolute top-[34px] left-1.5 z-3 flex w-[calc(200%-14px)] items-center gap-2 rounded-md px-2 py-1.5 transition-opacity md:top-[38px] md:left-[9px] md:w-[calc(200%-19px)] md:px-[11px] md:py-2 ${
        dimmed ? 'opacity-[0.18]' : dragSrc || isDragging ? 'opacity-35' : ''
      } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <span className="text-[13px] font-semibold md:text-[15px]">{slot.staff.shortCode}</span>
      <span className="hidden min-w-0 flex-1 truncate text-[11.5px] font-medium md:inline">
        {slot.staff.fullName}
        {layer === 'SHO' ? ' · weekend' : ''}
      </span>
      <span className="ml-auto font-mono text-[10px] tracking-[0.04em]">{hours}</span>
    </div>
  )
}
