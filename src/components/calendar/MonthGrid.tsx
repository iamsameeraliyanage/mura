// The heart of the app (docs/04): a Mon–Sun month grid of DutyChips in the
// staff pen colors, with cash ◆ / post-cash ■ corner flags and dnd-kit swaps.
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import type { Slot, Violation } from '../../api/rosters'
import { dayOfWeek, monthGridRows } from '../../lib/dates'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface MonthGridProps {
  month: string
  slots: Slot[]
  violations: Violation[]
  canEdit: boolean
  onSwap: (a: Slot, b: Slot) => void
  onDropOnEmpty: (slot: Slot, date: string) => void
  onDayClick: (date: string, slot: Slot | null) => void
}

export function MonthGrid(props: MonthGridProps) {
  const byDate = new Map(props.slots.map((s) => [s.date.slice(0, 10), s]))
  const violationDates = new Set(props.violations.filter((v) => v.date).map((v) => v.date))

  const handleDragEnd = (event: DragEndEvent) => {
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
    <DndContext onDragEnd={handleDragEnd}>
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
    </DndContext>
  )
}

function DayCell({
  date,
  slot,
  hasViolation,
  canEdit,
  onClick,
}: {
  date: string
  slot: Slot | null
  hasViolation: boolean
  canEdit: boolean
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date, disabled: !canEdit })
  const weekend = dayOfWeek(date) === 0 || dayOfWeek(date) === 6
  const dayNum = Number(date.slice(8))

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
      className={`relative min-h-14 border-b border-r border-grid p-1 md:min-h-18 md:p-1.5 ${
        weekend ? 'bg-weekend-bg' : 'bg-sheet'
      } ${isOver ? 'ring-2 ring-inset ring-scrub-500' : ''} ${
        hasViolation || slot?.conflictFlag ? 'ring-2 ring-inset ring-danger' : ''
      } ${canEdit ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500' : ''}`}
    >
      <span className="font-mono text-xs text-ink-soft">{dayNum}</span>
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
        <span title={slot.conflictReason} className="absolute right-1 top-1 text-xs text-danger">
          ⚠
        </span>
      )}
    </div>
  )
}

function DutyChip({ slot, canEdit }: { slot: Slot; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot.id,
    disabled: !canEdit,
  })

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // a real drag shouldn't also open the day dialog
        if (isDragging) e.stopPropagation()
      }}
      style={{
        color: `var(--color-${slot.staff.colorKey})`,
        backgroundColor: `var(--color-${slot.staff.colorKey}-bg)`,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        touchAction: 'none',
      }}
      title={slot.staff.fullName}
      className={`relative inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-sm font-semibold ${
        isDragging ? 'z-10 scale-105 shadow-lg' : ''
      } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} motion-reduce:transition-none`}
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
