// The heart of the app (docs/04): a Mon–Sun month grid of DutyChips in the
// staff pen colors, with cash ◆ / post-cash ■ corner flags and dnd-kit swaps.
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
import type { Slot, Violation } from '../../api/rosters'
import { dayOfWeek, monthGridRows } from '../../lib/dates'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface MonthGridProps {
  month: string
  slots: Slot[]
  violations: Violation[]
  /** date (YYYY-MM-DD) → holiday name */
  holidays?: Record<string, string>
  canEdit: boolean
  onSwap: (a: Slot, b: Slot) => void
  onDropOnEmpty: (slot: Slot, date: string) => void
  onDayClick: (date: string, slot: Slot | null) => void
}

export function MonthGrid(props: MonthGridProps) {
  const byDate = new Map(props.slots.map((s) => [s.date.slice(0, 10), s]))
  const violationDates = new Set(props.violations.filter((v) => v.date).map((v) => v.date))
  const [dragging, setDragging] = useState<Slot | null>(null)

  // 6px of movement before a drag starts — keeps plain taps opening the day
  // dialog instead of being swallowed by the drag listeners.
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
      <div className="overflow-hidden rounded-lg border border-grid bg-sheet">
        <div className="grid grid-cols-7 border-b border-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1.5 text-center text-xs font-medium text-ink-soft">
              {d}
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
                  slot={byDate.get(date) ?? null}
                  hasViolation={violationDates.has(date)}
                  holiday={props.holidays?.[date]}
                  canEdit={props.canEdit}
                  onClick={() => props.onDayClick(date, byDate.get(date) ?? null)}
                />
              ) : (
                <div key={`pad-${i}-${j}`} className="border-b border-r border-grid bg-paper" />
              ),
            )}
          </div>
        ))}
      </div>
      {/* Floating copy of the chip following the cursor, with a settle animation */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {dragging ? <ChipBody slot={dragging} className="scale-110 rotate-2 shadow-xl" /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function DayCell({
  date,
  slot,
  hasViolation,
  holiday,
  canEdit,
  onClick,
}: {
  date: string
  slot: Slot | null
  hasViolation: boolean
  holiday?: string
  canEdit: boolean
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date, disabled: !canEdit })
  const weekend = dayOfWeek(date) === 0 || dayOfWeek(date) === 6
  const dayNum = Number(date.slice(8))

  // Cell tint priority: casualty (cash) day > public holiday > weekend
  const tint = slot?.isCash
    ? 'bg-cash-bg'
    : holiday
      ? 'bg-holiday-bg'
      : weekend
        ? 'bg-weekend-bg'
        : 'bg-sheet'

  return (
    <div
      ref={setNodeRef}
      id={`day-${date}`}
      onClick={onClick}
      role={canEdit ? 'button' : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onKeyDown={(e) => {
        if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={`relative min-h-14 border-r border-b border-grid p-1 md:min-h-18 md:p-1.5 ${tint} ${
        isOver ? 'ring-2 ring-scrub-500 ring-inset' : ''
      } ${hasViolation || slot?.conflictFlag ? 'ring-2 ring-danger ring-inset' : ''} ${
        canEdit
          ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-scrub-500 focus-visible:outline-none'
          : ''
      }`}
    >
      <span className="flex items-start justify-between gap-1">
        <span className="font-mono text-xs text-ink-soft">{dayNum}</span>
        {holiday && (
          <span
            title={holiday}
            className="max-w-full truncate rounded bg-danger-bg px-1 text-[9px] leading-4 font-medium text-danger"
          >
            PH · {holiday}
          </span>
        )}
      </span>
      <div className="mt-0.5 flex flex-col items-center gap-0.5">
        {slot ? (
          <>
            <DutyChip slot={slot} canEdit={canEdit} />
            {slot.secondOnCall && (
              <span
                className="rounded px-1 text-[10px] font-medium"
                style={{
                  color: `var(--color-${slot.secondOnCall.colorKey})`,
                  backgroundColor: `var(--color-${slot.secondOnCall.colorKey}-bg)`,
                }}
                title={`2nd on-call: ${slot.secondOnCall.fullName}`}
              >
                2nd {slot.secondOnCall.shortCode}
              </span>
            )}
          </>
        ) : (
          <span className="mt-1 rounded bg-warn-bg px-1.5 py-0.5 text-[10px] font-medium text-warn">
            needs decision
          </span>
        )}
      </div>
      {slot?.conflictFlag && slot.conflictReason && (
        <span title={slot.conflictReason} className="absolute top-1 right-1 text-xs text-danger">
          ⚠
        </span>
      )}
    </div>
  )
}

/** Presentational chip — used in cells and inside the DragOverlay. */
function ChipBody({ slot, className = '' }: { slot: Slot; className?: string }) {
  return (
    <span
      style={{
        color: `var(--color-${slot.staff.colorKey})`,
        backgroundColor: `var(--color-${slot.staff.colorKey}-bg)`,
      }}
      title={slot.staff.fullName}
      className={`relative inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-sm font-semibold ${className}`}
    >
      {slot.staff.shortCode}
      {slot.isCash && (
        <span className="text-[10px] text-cash" title="cash (casualty)">
          ◆
        </span>
      )}
      {slot.isPostCash && (
        <span className="text-[10px] text-postcash" title="post-cash">
          ■
        </span>
      )}
    </span>
  )
}

function DutyChip({ slot, canEdit }: { slot: Slot; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: slot.id,
    disabled: !canEdit,
  })

  return (
    <span ref={setNodeRef} {...listeners} {...attributes} style={{ touchAction: 'none' }}>
      {/* keyed by assignee so a swap remounts the chip and replays the pop */}
      <ChipBody
        key={slot.staffId}
        slot={slot}
        className={`chip-pop ${isDragging ? 'opacity-30' : ''} ${
          canEdit ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      />
    </span>
  )
}
