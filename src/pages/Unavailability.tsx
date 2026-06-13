import { useState } from 'react'
import { format } from 'date-fns'
import {
  useCreateUnavailability,
  useDeleteUnavailability,
  useStaff,
} from '../api/admin'
import { useMe } from '../api/auth'
import { Button, Card, Input, MiniLabel, PenChip, PenDot, useToast } from '../components/ui'
import { useUnitId } from '../lib/useUnitId'

const fmt = (iso: string) => format(new Date(iso), 'MMM dd, yyyy')

export default function UnavailabilityPage() {
  const { data: me } = useMe()
  const unitId = useUnitId()
  const toast = useToast()
  const { data: staff = [] } = useStaff(unitId)
  const create = useCreateUnavailability()
  const remove = useDeleteUnavailability()

  const active = staff.filter((s) => !s.activeUntil)
  const [person, setPerson] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')

  const canEdit = !!me // every signed-in editor can block dates

  const entries = staff
    .flatMap((s) => s.unavailability.map((u) => ({ ...u, staff: s })))
    .sort((a, b) => (a.from < b.from ? 1 : -1))

  const block = () => {
    const staffId = person ?? active[0]?.id
    if (!staffId || !from || !to || to < from) {
      toast('Pick a person and a valid date range')
      return
    }
    const who = staff.find((s) => s.id === staffId)
    create.mutate(
      { staffId, from, to, reason: reason || undefined },
      {
        onSuccess: () => {
          setReason('')
          toast(`${who?.shortCode ?? 'Dates'} blocked — the generator will skip these dates`)
        },
        onError: () => toast('Could not block those dates — try again'),
      },
    )
  }

  return (
    <div className="mx-auto max-w-[920px] px-4 py-6 md:px-7 md:py-[30px]">
      <MiniLabel>Unavailable dates · respected by the generator</MiniLabel>
      <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
        Who is away, when
      </h1>
      <div className="mt-1.5 font-mono text-xs text-ink-2 uppercase">
        The generator skips these dates · existing assignments that clash are flagged
      </div>

      {/* ── Add form ── */}
      {canEdit && (
        <Card className="mt-[22px] p-[17px]">
          <MiniLabel className="text-ink-3!">Mark someone away</MiniLabel>
          <div className="mt-[11px] flex flex-wrap gap-1.5">
            {active.map((s) => (
              <button
                key={s.id}
                onClick={() => setPerson(s.id)}
                className={`inline-flex h-[30px] items-center gap-[7px] rounded-md border bg-surface px-[11px] text-[12.5px] font-semibold whitespace-nowrap shadow-(--shadow-xs) transition-colors ${
                  (person ?? active[0]?.id) === s.id
                    ? 'border-teal-600'
                    : 'border-grid hover:border-grid-strong'
                }`}
              >
                <PenDot colorKey={s.colorKey} />
                {s.fullName.replace('Dr. ', '')}
              </button>
            ))}
          </div>
          <div className="mt-3.5 flex flex-wrap items-end gap-3">
            <div>
              <MiniLabel>From</MiniLabel>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1.5 w-auto! font-mono text-[12.5px]"
              />
            </div>
            <div>
              <MiniLabel>To</MiniLabel>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1.5 w-auto! font-mono text-[12.5px]"
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <MiniLabel>Reason</MiniLabel>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Conference, exam, leave"
                className="mt-1.5"
              />
            </div>
            <Button disabled={create.isPending} onClick={block}>
              {create.isPending ? 'Blocking…' : 'Block dates'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Entries ── */}
      <div className="mt-5 flex flex-col gap-2.5">
        {entries.length === 0 && (
          <Card className="px-4 py-8 text-center text-sm text-ink-2">
            No blocked dates. The generator currently has a free hand.
          </Card>
        )}
        {entries.map((u) => (
          <Card key={u.id} className="flex items-center gap-3 px-4 py-3">
            <PenChip colorKey={u.staff.colorKey} code={u.staff.shortCode} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="text-sm font-semibold">{u.staff.fullName}</span>
                <span className="font-mono text-xs whitespace-nowrap text-ink-2">
                  {fmt(u.from)} → {fmt(u.to)}
                </span>
              </div>
              {u.reason && <div className="mt-0.5 text-xs text-ink-2">{u.reason}</div>}
            </div>
            {canEdit && (
              <button
                title="Remove"
                onClick={() =>
                  remove.mutate(u.id, { onSuccess: () => toast('Blocked dates removed') })
                }
                className="h-7 w-7 rounded-md border border-grid bg-surface text-sm leading-none text-ink-3 transition-colors hover:border-danger hover:text-danger"
              >
                ×
              </button>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-3.5 text-[11.5px] text-ink-3">
        Blocked dates feed straight into the generator. If a roster already assigns the person
        inside a blocked range, the clash is flagged on the roster screen.
      </p>
    </div>
  )
}
