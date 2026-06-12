// Right-hand fairness sidebar: live month tallies with a bar vs pool average,
// plus the cumulative table (consultant) / weekend-rotation card (SHO).
import { LAYER_DEFAULT_POOL, type RosterLayer } from '../../../shared/types'
import { useFairness, type Roster } from '../../api/rosters'
import { Card, PenDot } from '../ui'
import { addDays, dayOfWeek, monthLabel } from '../../lib/dates'

const pad = (n: number) => String(n).padStart(2, '0')

/** Current-month tallies computed client-side so they update with every swap. */
export function monthTally(
  roster: Roster | null,
  layer: RosterLayer,
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {}
  if (!roster) return out
  const byDate = new Map(roster.slots.map((s) => [s.date.slice(0, 10), s]))
  for (const slot of roster.slots) {
    const t = (out[slot.staffId] ??= {
      days: 0,
      weekendBlocks: 0,
      onCalls: 0,
      cash: 0,
      postCash: 0,
    })
    t.days += 1
    t.onCalls += 1
    if (slot.isCash) t.cash += 1
    if (slot.isPostCash) t.postCash += 1
    const date = slot.date.slice(0, 10)
    if (slot.isWeekendBlock && dayOfWeek(date) === 6) t.weekendBlocks += 1
    if (layer !== 'CONSULTANT' && dayOfWeek(date) === 6 && !slot.isCash) {
      const sun = byDate.get(addDays(date, 1))
      if (sun && sun.staffId === slot.staffId && !sun.isCash) t.weekendBlocks += 1
    }
  }
  return out
}

function bar(value: number, avg: number) {
  const ratio = avg > 0 ? value / avg : 1
  const delta = Math.abs(ratio - 1)
  return {
    width: `${Math.max(6, Math.min(100, ratio * 60))}%`,
    color:
      delta > 0.12
        ? ratio > 1
          ? 'var(--color-bar-over)'
          : 'var(--color-bar-under)'
        : 'var(--color-bar-balanced)',
  }
}

export function FairnessPanel({
  unitId,
  layer,
  poolKinds,
  roster,
  month,
}: {
  unitId: string | undefined
  layer: RosterLayer
  poolKinds?: string[]
  roster: Roster | null
  month: string
}) {
  const { data } = useFairness(unitId, layer)
  const current = monthTally(roster, layer)

  const kinds = poolKinds ?? LAYER_DEFAULT_POOL[layer]
  const staff = (data?.staff ?? []).filter((s) => kinds.includes(s.kind))
  const active = staff.filter((s) => !s.activeUntil || s.activeUntil >= new Date().toISOString())
  const mainKey = layer === 'CONSULTANT' ? 'days' : 'onCalls'
  const avg = active.length
    ? active.reduce((sum, s) => sum + (current[s.id]?.[mainKey] ?? 0), 0) / active.length
    : 0

  // Non-cash weekend sequence this month (pool-roster card)
  const ncwBlocks: { dd: string; code: string; colorKey: string }[] = []
  if (layer !== 'CONSULTANT' && roster) {
    const byDate = new Map(roster.slots.map((s) => [s.date.slice(0, 10), s]))
    for (const s of roster.slots) {
      const date = s.date.slice(0, 10)
      if (dayOfWeek(date) !== 6 || s.isCash) continue
      const sun = byDate.get(addDays(date, 1))
      if (sun && sun.staffId === s.staffId && !sun.isCash) {
        ncwBlocks.push({
          dd: `${Number(date.slice(8))}–${Number(date.slice(8)) + 1}`,
          code: s.staff.shortCode,
          colorKey: s.staff.colorKey,
        })
      }
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3.5 lg:w-[280px] print:hidden">
      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-semibold">Fairness</span>
          <span className="font-mono text-[11px] text-ink-2 uppercase">{monthLabel(month)}</span>
        </div>
        <div className="mt-3 flex justify-end gap-2 border-b border-grid pb-1.5 text-[10px] font-semibold tracking-[0.04em] text-ink-3">
          {layer === 'CONSULTANT' ? (
            <>
              <span className="w-[26px] text-right">DAYS</span>
              <span className="w-[26px] text-right">WKD</span>
            </>
          ) : (
            <>
              <span className="w-6 text-right">OC</span>
              <span className="w-6 text-right">◆</span>
              <span className="w-6 text-right">■</span>
              <span className="w-7 text-right">WKD</span>
            </>
          )}
        </div>
        {active.map((s) => {
          const t = current[s.id] ?? {}
          const b = bar(t[mainKey] ?? 0, avg)
          return (
            <div key={s.id} className="flex items-center gap-2.5 border-b border-grid py-2">
              <PenDot colorKey={s.colorKey} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium">
                  {s.fullName.replace('Dr. ', '')}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-sm bg-bar-track">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{ width: b.width, backgroundColor: b.color }}
                  />
                </div>
              </div>
              {layer === 'CONSULTANT' ? (
                <>
                  <span className="w-[26px] text-right font-mono text-[13px]">
                    {pad(t.days ?? 0)}
                  </span>
                  <span className="w-[26px] text-right font-mono text-[13px] text-ink-2">
                    {pad(t.weekendBlocks ?? 0)}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-6 text-right font-mono text-[12.5px]">
                    {pad(t.onCalls ?? 0)}
                  </span>
                  <span className="w-6 text-right font-mono text-[12.5px] text-cash">
                    {pad(t.cash ?? 0)}
                  </span>
                  <span className="w-6 text-right font-mono text-[12.5px] text-postcash">
                    {pad(t.postCash ?? 0)}
                  </span>
                  <span className="w-7 text-right font-mono text-[12.5px] text-ink-2">
                    {pad(t.weekendBlocks ?? 0)}
                  </span>
                </>
              )}
            </div>
          )
        })}
        <p className="mt-2 text-[11px] text-ink-3">
          {layer === 'CONSULTANT'
            ? `Bar compares casualty days against the pool average for ${monthLabel(month)}.`
            : 'On-call, cash and post-cash are balanced separately — cash and post-cash inversely compensate.'}
        </p>

        {/* Cumulative across months */}
        <div className="mt-4 border-t border-grid pt-3.5">
          <div className="mr-label text-ink-3">Cumulative · all months</div>
          <div className="mt-2.5 flex justify-end gap-2 border-b border-grid pb-1.5 text-[10px] font-semibold tracking-[0.04em] text-ink-3">
            {layer === 'CONSULTANT' ? (
              <>
                <span className="w-8 text-right">CSLTY</span>
                <span className="w-[26px] text-right">WKD</span>
              </>
            ) : (
              <>
                <span className="w-6 text-right">OC</span>
                <span className="w-6 text-right">◆</span>
                <span className="w-6 text-right">■</span>
              </>
            )}
          </div>
          {staff.map((s) => {
            const t = data?.cumulative[s.id] ?? {}
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2.5 border-b border-grid py-[7px] ${
                  s.activeUntil ? 'opacity-60' : ''
                }`}
              >
                <PenDot colorKey={s.colorKey} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                  {s.fullName.replace('Dr. ', '')}
                </span>
                {layer === 'CONSULTANT' ? (
                  <>
                    <span className="w-8 text-right font-mono text-[12.5px]">
                      {pad(t.days ?? 0)}
                    </span>
                    <span className="w-[26px] text-right font-mono text-[12.5px]">
                      {pad(t.weekendBlocks ?? 0)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-6 text-right font-mono text-[12.5px]">
                      {pad(t.onCalls ?? 0)}
                    </span>
                    <span className="w-6 text-right font-mono text-[12.5px] text-cash">
                      {pad(t.cash ?? 0)}
                    </span>
                    <span className="w-6 text-right font-mono text-[12.5px] text-postcash">
                      {pad(t.postCash ?? 0)}
                    </span>
                  </>
                )}
              </div>
            )
          })}
          <p className="mt-2 text-[11px] leading-snug text-ink-2">
            Counts survive staff turnover — new joiners start at 0.
          </p>
        </div>
      </Card>

      {layer !== 'CONSULTANT' && ncwBlocks.length > 0 && (
        <Card className="p-4">
          <div className="mr-label text-ink-3">
            {layer === 'SHO' ? 'Non-cash weekend rotation' : 'Weekend rotation'}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {ncwBlocks.map((b, i) => (
              <span key={b.dd} className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-6 min-w-[26px] items-center justify-center rounded-md px-[7px] text-xs font-semibold"
                  style={{
                    color: `var(--color-${b.colorKey})`,
                    backgroundColor: `var(--color-${b.colorKey}-bg)`,
                  }}
                >
                  {b.code}
                </span>
                <span className="font-mono text-[10.5px] text-ink-2">{b.dd}</span>
                {i < ncwBlocks.length - 1 && <span className="text-[11px] text-ink-3">→</span>}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-normal text-ink-2">
            One person covers Sat + Sun (counts as 2 on-calls). The rotation carries across
            months; the cash weekend splits between two people instead.
          </p>
        </Card>
      )}
    </aside>
  )
}
