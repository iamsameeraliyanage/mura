import { useFairness } from '../api/rosters'
import { Card, MiniLabel, PenChip, PenDot } from '../components/ui'
import { monthLabel } from '../lib/dates'
import { useUnitId } from '../lib/useUnitId'

const pad = (n: number) => String(n).padStart(2, '0')

export default function FairnessPage() {
  const unitId = useUnitId()
  const consultant = useFairness(unitId, 'CONSULTANT').data
  const sho = useFairness(unitId, 'SHO').data

  const consultants = (consultant?.staff ?? []).filter((s) => s.kind === 'CONSULTANT')
  const totals = consultants.map((s) => consultant?.cumulative[s.id]?.days ?? 0)
  const maxTotal = Math.max(1, ...totals)
  const maxWkd = Math.max(
    1,
    ...consultants.map((s) => consultant?.cumulative[s.id]?.weekendBlocks ?? 0),
  )
  const wkdValues = consultants.map((s) => consultant?.cumulative[s.id]?.weekendBlocks ?? 0)
  const minWkd = wkdValues.length ? Math.min(...wkdValues) : 0

  const shoStaff = (sho?.staff ?? []).filter((s) => s.kind === 'SHO' || s.kind === 'RHO')
  const shoMonths = (sho?.perMonth ?? []).slice(-3)

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 md:px-7 md:py-[30px]">
      <MiniLabel>Fairness · cumulative across months</MiniLabel>
      <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
        Who carries what
      </h1>
      <div className="mt-1.5 font-mono text-xs text-ink-2 uppercase">
        Counts survive staff turnover · new joiners start at 0
      </div>

      {/* ── Consultants ── */}
      <Card className="mt-7 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-base font-semibold">Consultants — casualty</span>
          <span className="font-mono text-[11px] text-ink-2 uppercase">
            Weekday + weekend tracked separately
          </span>
        </div>

        <div className="mt-3.5 flex gap-2 border-b border-grid pb-1.5 text-[10px] font-semibold tracking-[0.04em] text-ink-3">
          <span className="w-[150px]">CONSULTANT</span>
          <span className="hidden flex-1 sm:inline">TOTAL CASUALTY DAYS</span>
          <span className="w-11 text-right">DAYS</span>
          <span className="hidden w-[130px] text-right sm:inline">WEEKEND BLOCKS</span>
        </div>
        {consultants.map((s) => {
          const total = consultant?.cumulative[s.id]?.days ?? 0
          const wkd = consultant?.cumulative[s.id]?.weekendBlocks ?? 0
          return (
            <div key={s.id} className="flex items-center gap-2 border-b border-grid py-3">
              <span className="flex w-[150px] items-center gap-2">
                <PenChip colorKey={s.colorKey} code={s.shortCode} size="sm" />
                <span className="truncate text-[13px] font-medium">{s.fullName}</span>
              </span>
              <span className="hidden flex-1 sm:inline">
                <span className="block h-2.5 overflow-hidden rounded-[3px] bg-bar-track">
                  <span
                    className="block h-full rounded-[3px] transition-all duration-300"
                    style={{
                      width: `${Math.round((total / maxTotal) * 100)}%`,
                      backgroundColor: `var(--color-${s.colorKey}-dot)`,
                    }}
                  />
                </span>
              </span>
              <span className="w-11 text-right font-mono text-[13.5px]">{pad(total)}</span>
              <span className="hidden w-[130px] items-center justify-end gap-1 sm:flex">
                {Array.from({ length: Math.max(maxWkd, 4) }, (_, j) => (
                  <span
                    key={j}
                    className="h-[9px] w-[9px] rounded-[2px]"
                    style={{
                      backgroundColor:
                        j < wkd ? `var(--color-${s.colorKey}-dot)` : 'var(--color-bar-track)',
                    }}
                  />
                ))}
                <span
                  className={`ml-1 font-mono text-[12.5px] ${
                    wkd === maxWkd
                      ? 'font-bold text-bar-over'
                      : wkd === minWkd
                        ? 'font-bold text-bar-under'
                        : ''
                  }`}
                >
                  {pad(wkd)}
                </span>
              </span>
            </div>
          )
        })}
        {consultants.length > 0 && maxWkd - minWkd >= 2 && (
          <div className="mt-3 flex gap-2.5 rounded-md bg-cash-bg px-3 py-2.5">
            <span className="text-xs font-bold text-cash">!</span>
            <span className="flex-1 text-[12.5px] leading-normal">
              The weekend-block spread is {maxWkd - minWkd} — the generator offers the consultant
              with the fewest blocks first for the next open weekend.
            </span>
          </div>
        )}
      </Card>

      {/* ── SHO pool ── */}
      <Card className="mt-[18px] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-base font-semibold">SHO/RHO pool — month by month</span>
          <span className="font-mono text-[11px] text-ink-2 uppercase">
            Pool changes every few months · history is kept forever
          </span>
        </div>

        {shoMonths.length === 0 ? (
          <p className="mt-4 text-sm text-ink-2">No SHO/RHO rosters yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {shoMonths.map((m, idx) => {
              const latest = idx === shoMonths.length - 1
              const rows = shoStaff.filter((s) => (m.tally[s.id]?.onCalls ?? 0) > 0)
              return (
                <div
                  key={m.month}
                  className={`overflow-hidden rounded-lg border ${
                    latest ? 'border-teal-600' : 'border-grid'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b border-grid px-3 py-2.5 ${
                      latest ? 'bg-teal-50' : 'bg-sunken'
                    }`}
                  >
                    <span className="font-display text-base font-semibold">
                      {monthLabel(m.month)}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-2 uppercase">
                      Pool of {rows.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5 px-3 pt-2 pb-1 text-[9.5px] font-semibold tracking-[0.04em] text-ink-3">
                    <span className="flex-1" />
                    <span className="w-[26px] text-right">OC</span>
                    <span className="w-[22px] text-right">◆</span>
                    <span className="w-[22px] text-right">■</span>
                  </div>
                  {rows.map((s) => {
                    const t = m.tally[s.id] ?? {}
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-1.5 border-t border-grid px-3 py-1.5"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-[7px]">
                          <PenDot colorKey={s.colorKey} className="h-2! w-2!" />
                          <span className="truncate text-xs font-medium">{s.fullName}</span>
                        </span>
                        <span className="w-[26px] text-right font-mono text-xs">
                          {pad(t.onCalls ?? 0)}
                        </span>
                        <span className="w-[22px] text-right font-mono text-xs text-cash">
                          {pad(t.cash ?? 0)}
                        </span>
                        <span className="w-[22px] text-right font-mono text-xs text-postcash">
                          {pad(t.postCash ?? 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3.5 md:flex-row">
          <div className="flex-1 rounded-md bg-sunken px-3.5 py-3">
            <MiniLabel className="text-ink-3!">Inverse compensation</MiniLabel>
            <p className="mt-1.5 text-[12.5px] leading-relaxed">
              More cash ◆ means less post-cash ■ — the two flags are balanced against each other
              every month, on top of the even on-call split.
            </p>
          </div>
          <div className="flex-1 rounded-md bg-sunken px-3.5 py-3">
            <MiniLabel className="text-ink-3!">Pool turnover</MiniLabel>
            <p className="mt-1.5 text-[12.5px] leading-relaxed">
              RHOs rotate out every few months. A returning or new member starts their counts at
              0 while the leaver's history stays on record.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
