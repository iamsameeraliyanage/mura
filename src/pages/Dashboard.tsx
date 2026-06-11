import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { RosterLayer } from '../../shared/types'
import { useMe } from '../api/auth'
import { useFairness } from '../api/rosters'
import { useHospitals } from '../api/admin'
import { monthLabel } from '../lib/dates'

const LAYER_COLUMNS: Record<RosterLayer, { key: string; label: string }[]> = {
  CONSULTANT: [
    { key: 'days', label: 'casualty' },
    { key: 'weekendBlocks', label: 'weekend' },
  ],
  SHO: [
    { key: 'onCalls', label: 'on-call' },
    { key: 'cash', label: 'cash' },
    { key: 'postCash', label: 'post-cash' },
  ],
}

function useUnitId(): string | undefined {
  const { data: me } = useMe()
  const { data: hospitals } = useHospitals(me?.role === 'ADMIN')
  if (me?.unitId) return me.unitId
  return hospitals?.[0]?.departments[0]?.units[0]?.id
}

export default function Dashboard() {
  const { data: me } = useMe()
  const unitId = useUnitId()
  const [layer, setLayer] = useState<RosterLayer>('CONSULTANT')
  const { data } = useFairness(unitId, layer)

  const columns = LAYER_COLUMNS[layer]
  const staff = (data?.staff ?? []).filter((s) =>
    layer === 'CONSULTANT' ? s.kind === 'CONSULTANT' : s.kind === 'SHO' || s.kind === 'RHO',
  )
  const months = data?.perMonth ?? []

  return (
    <div className="mx-auto max-w-280 px-4 py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Welcome{me ? `, ${me.displayName}` : ''}
      </h1>

      <div className="mt-4 flex gap-2">
        <Link
          to="/roster/consultant"
          className="rounded-md border border-grid bg-sheet px-4 py-2 text-sm font-medium hover:bg-scrub-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500"
        >
          Consultant Roster →
        </Link>
        <Link
          to="/roster/sho"
          className="rounded-md border border-grid bg-sheet px-4 py-2 text-sm font-medium hover:bg-scrub-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500"
        >
          SHO Roster →
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fairness summary</h2>
          <div className="flex rounded-md border border-grid bg-sheet p-0.5">
            {(['CONSULTANT', 'SHO'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLayer(l)}
                className={`rounded px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500 ${
                  layer === l ? 'bg-scrub-600 font-medium text-white' : 'text-ink-soft'
                }`}
              >
                {l === 'CONSULTANT' ? 'Consultants' : 'SHO/RHO'}
              </button>
            ))}
          </div>
        </div>

        {months.length === 0 ? (
          <p className="mt-4 text-sm text-ink-faint">No rosters yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-grid bg-sheet">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-grid text-xs text-ink-soft">
                  <th className="px-4 py-2.5 text-left font-medium">Who</th>
                  {months.map((m) => (
                    <th key={m.month} className="px-3 py-2.5 text-right font-medium">
                      {monthLabel(m.month).slice(0, 3)} {m.month.slice(0, 4)}
                      {m.status === 'DRAFT' && <span className="ml-1 text-draft">(draft)</span>}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-grid last:border-0 ${s.activeUntil ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: `var(--color-${s.colorKey})` }}
                        />
                        <span className="font-medium">{s.shortCode}</span>
                        <span className="text-xs text-ink-faint">{s.fullName}</span>
                      </span>
                    </td>
                    {months.map((m) => (
                      <td key={m.month} className="px-3 py-2 text-right font-mono text-xs">
                        {columns.map((c) => m.tally[s.id]?.[c.key] ?? 0).join(' / ')}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-mono text-xs font-semibold">
                      {columns.map((c) => data?.cumulative[s.id]?.[c.key] ?? 0).join(' / ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-grid px-4 py-2 text-xs text-ink-faint">
              Columns: {columns.map((c) => c.label).join(' / ')}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
