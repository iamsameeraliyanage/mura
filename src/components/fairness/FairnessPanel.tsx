// Live tallies per person (docs/04): pen dot, mono counts, bar vs pool average.
import type { RosterLayer } from '../../../shared/types'
import { useFairness, type Roster } from '../../api/rosters'
import { dayOfWeek, addDays } from '../../lib/dates'

const COLUMNS: Record<RosterLayer, { key: string; label: string }[]> = {
  CONSULTANT: [
    { key: 'days', label: 'days' },
    { key: 'weekendBlocks', label: 'w/e' },
  ],
  SHO: [
    { key: 'onCalls', label: 'on-call' },
    { key: 'cash', label: 'cash' },
    { key: 'postCash', label: 'post' },
  ],
}

/** Current-month tallies computed client-side so they update with every swap. */
function monthTally(
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
    if (layer === 'SHO' && dayOfWeek(date) === 6 && !slot.isCash) {
      const sun = byDate.get(addDays(date, 1))
      if (sun && sun.staffId === slot.staffId && !sun.isCash) t.weekendBlocks += 1
    }
  }
  return out
}

export function FairnessPanel({
  unitId,
  layer,
  roster,
}: {
  unitId: string | undefined
  layer: RosterLayer
  roster: Roster | null
}) {
  const { data } = useFairness(unitId, layer)
  const columns = COLUMNS[layer]
  const current = monthTally(roster, layer)

  const staff = (data?.staff ?? []).filter((s) =>
    layer === 'CONSULTANT' ? s.kind === 'CONSULTANT' : s.kind === 'SHO' || s.kind === 'RHO',
  )
  const active = staff.filter((s) => !s.activeUntil || s.activeUntil >= new Date().toISOString())

  const avg = (key: string) =>
    active.length
      ? active.reduce((sum, s) => sum + (current[s.id]?.[key] ?? 0), 0) / active.length
      : 0

  return (
    <aside className="w-full shrink-0 lg:w-[280px]">
      <div className="rounded-lg border border-grid bg-sheet p-4">
        <h3 className="text-sm font-semibold">This month</h3>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-xs text-ink-soft">
              <th className="pb-1 text-left font-medium">who</th>
              {columns.map((c) => (
                <th key={c.key} className="pb-1 text-right font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((s) => {
              const t = current[s.id] ?? {}
              const over = (t[columns[0].key] ?? 0) > avg(columns[0].key) + 0.5
              return (
                <tr key={s.id}>
                  <td className="py-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: `var(--color-${s.colorKey})` }}
                      />
                      <span className="font-medium">{s.shortCode}</span>
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`py-0.5 text-right font-mono text-xs ${
                        over && c.key === columns[0].key ? 'text-warn' : ''
                      }`}
                    >
                      {t[c.key] ?? 0}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        <h3 className="mt-5 text-sm font-semibold">Cumulative</h3>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {staff.map((s) => {
              const t = data?.cumulative[s.id] ?? {}
              return (
                <tr key={s.id} className={s.activeUntil ? 'opacity-50' : ''}>
                  <td className="py-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: `var(--color-${s.colorKey})` }}
                      />
                      <span className="font-medium">{s.shortCode}</span>
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="py-0.5 text-right font-mono text-xs">
                      {t[c.key] ?? 0}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </aside>
  )
}
