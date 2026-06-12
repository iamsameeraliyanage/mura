import { useState } from 'react'
import { format } from 'date-fns'
import { STAFF_KINDS, type StaffKind } from '../../../shared/types'
import {
  useCreateStaff,
  useCreateUnavailability,
  useDeleteUnavailability,
  useHospitals,
  useStaff,
  useUpdateStaff,
  type Staff,
} from '../../api/admin'
import { Button, Dialog, Field, Input, PenChip, PEN_KEYS, Select } from '../../components/ui'

const day = (iso: string) => format(new Date(iso), 'd MMM yyyy')

export default function StaffPage() {
  const { data: staff = [], isLoading } = useStaff()
  const { data: hospitals = [] } = useHospitals()
  const [editing, setEditing] = useState<Staff | 'new' | null>(null)
  const [markingLeave, setMarkingLeave] = useState<Staff | null>(null)

  const units = hospitals.flatMap((h) =>
    h.departments.flatMap((d) => d.units.map((u) => ({ ...u, label: `${d.name} · ${u.name}` }))),
  )

  return (
    <div className="mx-auto max-w-280 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Staff</h1>
        <Button onClick={() => setEditing('new')}>Add staff member</Button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink-faint">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-grid bg-sheet">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-grid text-xs text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Chip</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Kind</th>
                <th className="px-4 py-2.5 font-medium">Active</th>
                <th className="px-4 py-2.5 font-medium">Unavailable dates</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-grid last:border-0">
                  <td className="px-4 py-2.5">
                    <PenChip colorKey={s.colorKey} code={s.shortCode} />
                  </td>
                  <td className="px-4 py-2.5">
                    {s.fullName}
                    {s.isSeat && (
                      <span className="ml-2 text-xs text-ink-faint">
                        seat · holder: {s.currentHolder ?? '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{s.kind}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-soft">
                    {day(s.activeFrom)} → {s.activeUntil ? day(s.activeUntil) : 'present'}
                  </td>
                  <td className="px-4 py-2.5">
                    <UnavailabilityList staff={s} />
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Button variant="ghost" onClick={() => setMarkingLeave(s)} className="mr-2">
                      Mark leave
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(s)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <StaffDialog
          staff={editing === 'new' ? null : editing}
          units={units}
          onClose={() => setEditing(null)}
        />
      )}
      {markingLeave && <LeaveDialog staff={markingLeave} onClose={() => setMarkingLeave(null)} />}
    </div>
  )
}

function UnavailabilityList({ staff }: { staff: Staff }) {
  const del = useDeleteUnavailability()
  if (staff.unavailability.length === 0) return <span className="text-ink-faint">—</span>
  return (
    <ul className="space-y-1">
      {staff.unavailability.map((u) => (
        <li key={u.id} className="flex items-center gap-2 font-mono text-xs">
          <span>
            {day(u.from)} – {day(u.to)}
          </span>
          {u.reason && <span className="text-ink-faint">({u.reason})</span>}
          <button
            onClick={() => del.mutate(u.id)}
            aria-label="Remove unavailability"
            className="text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

function StaffDialog({
  staff,
  units,
  onClose,
}: {
  staff: Staff | null
  units: { id: string; label: string }[]
  onClose: () => void
}) {
  const create = useCreateStaff()
  const update = useUpdateStaff()
  const [form, setForm] = useState({
    unitId: staff?.unitId ?? units[0]?.id ?? '',
    kind: staff?.kind ?? ('SHO' as StaffKind),
    fullName: staff?.fullName ?? '',
    shortCode: staff?.shortCode ?? '',
    colorKey: staff?.colorKey ?? 'pen-blue',
    isSeat: staff?.isSeat ?? false,
    currentHolder: staff?.currentHolder ?? '',
    activeFrom: staff ? staff.activeFrom.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
    activeUntil: staff?.activeUntil ? staff.activeUntil.slice(0, 10) : '',
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const submit = () => {
    const payload = {
      kind: form.kind,
      fullName: form.fullName,
      shortCode: form.shortCode,
      colorKey: form.colorKey,
      isSeat: form.isSeat,
      currentHolder: form.isSeat ? form.currentHolder || null : null,
      activeFrom: form.activeFrom,
      activeUntil: form.activeUntil || null,
    }
    const done = { onSuccess: onClose }
    if (staff) update.mutate({ id: staff.id, ...payload }, done)
    else create.mutate({ unitId: form.unitId, ...payload }, done)
  }

  return (
    <Dialog open title={staff ? `Edit ${staff.fullName}` : 'Add staff member'} onClose={onClose}>
      <div className="space-y-3">
        {!staff && (
          <Field label="Unit">
            <Select value={form.unitId} onChange={(e) => set({ unitId: e.target.value })}>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Full name">
          <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kind">
            <Select value={form.kind} onChange={(e) => set({ kind: e.target.value as StaffKind })}>
              {STAFF_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          </Field>
          <Field label="Short code">
            <Input
              value={form.shortCode}
              maxLength={4}
              onChange={(e) => set({ shortCode: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Pen color">
          <div className="flex flex-wrap gap-1.5">
            {PEN_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => set({ colorKey: key })}
                aria-label={key}
                className={`h-7 w-7 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500 ${
                  form.colorKey === key ? 'ring-2 ring-scrub-600 ring-offset-2' : ''
                }`}
                style={{ backgroundColor: `var(--color-${key})` }}
              />
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Active from">
            <Input
              type="date"
              value={form.activeFrom}
              onChange={(e) => set({ activeFrom: e.target.value })}
            />
          </Field>
          <Field label="Active until (blank = present)">
            <Input
              type="date"
              value={form.activeUntil}
              onChange={(e) => set({ activeUntil: e.target.value })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isSeat}
            onChange={(e) => set({ isSeat: e.target.checked })}
          />
          This is a unit seat (e.g. Prof Unit), not a person
        </label>
        {form.isSeat && (
          <Field label="Current holder">
            <Input
              value={form.currentHolder}
              onChange={(e) => set({ currentHolder: e.target.value })}
            />
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!form.fullName || !form.shortCode || create.isPending || update.isPending}
          >
            {staff ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function LeaveDialog({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const create = useCreateUnavailability()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')

  return (
    <Dialog open title={`Mark leave — ${staff.fullName}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <Field label="Reason (optional)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!from || !to || from > to || create.isPending}
            onClick={() =>
              create.mutate(
                { staffId: staff.id, from, to, reason: reason || undefined },
                { onSuccess: onClose },
              )
            }
          >
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
