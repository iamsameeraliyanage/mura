import { useState } from 'react'
import { format } from 'date-fns'
import type { Role, StaffKind } from '../../../shared/types'
import {
  useCreateHoliday,
  useCreateStaff,
  useCreateUser,
  useDeleteHoliday,
  useHolidays,
  useStaff,
  useUpdateStaff,
  useUsers,
} from '../../api/admin'
import {
  Button,
  Card,
  Field,
  Input,
  MiniLabel,
  Modal,
  PEN_KEYS,
  PenChip,
  Select,
  useToast,
} from '../../components/ui'
import { useUnitId } from '../../lib/useUnitId'

const SHIFTS = [
  {
    duty: 'On-call',
    layer: 'SHO/RHO',
    time: '8:00 am → next day 4:00 pm',
    hours: '32 h',
    note: 'Every day · exactly one person',
  },
  {
    duty: 'Cash (casualty)',
    layer: 'SHO/RHO',
    time: '8:00 am → next day 4:00 pm',
    hours: '32 h',
    note: 'Flag on the on-call · only on Pu days',
  },
  {
    duty: 'Post-cash',
    layer: 'SHO/RHO',
    time: '8:00 am → 4:00 pm',
    hours: '8 h',
    note: 'Day after every cash day · different person',
  },
  {
    duty: '2nd on-call',
    layer: 'SHO/RHO',
    time: '8:00 am → 4:00 pm',
    hours: '8 h',
    note: 'Transfer duty · someone not on-call that day',
  },
  {
    duty: 'Weekday casualty',
    layer: 'Consultant',
    time: '8:00 am → next day 8:00 am',
    hours: '24 h',
    note: '',
  },
  {
    duty: 'Weekend casualty',
    layer: 'Consultant',
    time: 'Sat 8:00 am → Mon 8:00 am',
    hours: '48 h',
    note: 'One consultant covers the whole block',
  },
]

const ROLE_BADGE: Record<Role, { label: string; cls: string }> = {
  ADMIN: { label: 'ADMIN', cls: 'bg-sunken text-ink-2' },
  CONSULTANT_EDITOR: { label: 'CONSULTANT EDITOR', cls: 'bg-draft-bg text-draft' },
  SHO_EDITOR: { label: 'SHO EDITOR', cls: 'bg-published-bg text-published' },
}

const ROLE_POWERS: Record<Role, string> = {
  ADMIN: 'Hospitals, departments, staff, users, shift config',
  CONSULTANT_EDITOR: 'Creates & publishes the consultant casualty roster',
  SHO_EDITOR: 'Builds the SHO/RHO roster once consultants publish',
}

export default function StaffPage() {
  const unitId = useUnitId()
  const toast = useToast()
  const { data: staff = [] } = useStaff(unitId)
  const { data: users = [] } = useUsers()
  const { data: holidays = [] } = useHolidays()
  const updateStaff = useUpdateStaff()

  const [addOpen, setAddOpen] = useState(false)
  const [seatOpen, setSeatOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const seat = staff.find((s) => s.isSeat)
  const consultants = staff.filter((s) => s.kind === 'CONSULTANT')
  const pool = staff.filter((s) => s.kind === 'SHO' || s.kind === 'RHO')
  const activePool = pool.filter((s) => !s.activeUntil)
  const shoCount = activePool.filter((s) => s.kind === 'SHO').length

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 md:px-7 md:py-[30px]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <MiniLabel>Admin · Lady Ridgeway Hospital → Paediatrics → Prof Unit</MiniLabel>
          <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
            Staff & configuration
          </h1>
        </div>
        <div className="pb-1">
          <Button onClick={() => setAddOpen(true)}>Add staff</Button>
        </div>
      </div>

      {/* ── Prof Unit seat ── */}
      {seat && (
        <Card className="mt-6 p-[17px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <PenChip colorKey={seat.colorKey} code={seat.shortCode} size="md" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {seat.fullName}{' '}
                <span className="ml-1 rounded bg-draft-bg px-1.5 py-0.5 align-[2px] text-[9.5px] font-bold tracking-[0.05em] text-draft">
                  SEAT
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-2">
                A unit, not a person — history stays with the seat when the holder changes.
              </div>
            </div>
            <div className="text-right">
              <MiniLabel className="text-ink-3!">Current holder</MiniLabel>
              <div className="mt-0.5 text-[13.5px] font-semibold">
                {seat.currentHolder ?? '—'}
              </div>
            </div>
            <button
              onClick={() => setSeatOpen(true)}
              className="h-[30px] rounded-md border border-grid bg-surface px-3 text-xs font-semibold whitespace-nowrap text-teal-700 hover:bg-teal-50"
            >
              Change holder
            </button>
          </div>
        </Card>
      )}

      {/* ── Staff tables ── */}
      <div className="mt-3.5 grid grid-cols-1 items-start gap-3.5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
            <span className="text-[15px] font-semibold">Consultant layer</span>
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              {consultants.length} seats
            </span>
          </div>
          {consultants.map((s) => (
            <div key={s.id} className="flex items-center gap-[11px] border-t border-grid px-4 py-[11px]">
              <span
                title="pen color"
                className="h-3.5 w-3.5 shrink-0 rounded"
                style={{ backgroundColor: `var(--color-${s.colorKey}-dot)` }}
              />
              <PenChip colorKey={s.colorKey} code={s.shortCode} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">
                  {s.isSeat && s.currentHolder ? `${s.fullName} — ${s.currentHolder}` : s.fullName}
                </span>
                <span className="block text-[11px] text-ink-2">
                  {s.isSeat ? 'Seat · holder can change' : 'Consultant'}
                </span>
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap text-ink-2 uppercase">
                {format(new Date(s.activeFrom), 'MMM yyyy')}
              </span>
            </div>
          ))}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
            <span className="text-[15px] font-semibold">SHO/RHO pool</span>
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              Pool of {activePool.length} · {shoCount} SHO + {activePool.length - shoCount} RHO
            </span>
          </div>
          {pool.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-[11px] border-t border-grid px-4 py-[11px] ${
                s.activeUntil ? 'opacity-60' : ''
              }`}
            >
              <span
                title="pen color"
                className="h-3.5 w-3.5 shrink-0 rounded"
                style={{ backgroundColor: `var(--color-${s.colorKey}-dot)` }}
              />
              <PenChip colorKey={s.colorKey} code={s.shortCode} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">{s.fullName}</span>
                <span className="block text-[11px] text-ink-2">
                  {s.kind} · combined pool, same duties
                </span>
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap text-ink-2 uppercase">
                {format(new Date(s.activeFrom), 'MMM yyyy')} →
                {s.activeUntil ? ` ${format(new Date(s.activeUntil), 'MMM yyyy')}` : ''}
              </span>
            </div>
          ))}
          <div className="border-t border-grid bg-sunken px-4 py-2.5 text-[11.5px] leading-normal text-ink-2">
            RHOs rotate out every few months. New members start their fairness counts at 0 —
            history of leavers is kept permanently.
          </div>
        </Card>
      </div>

      {/* ── Editors ── */}
      <Card className="mt-3.5 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3.5 pb-2.5">
          <span className="text-[15px] font-semibold">Editor accounts</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              No self-signup · scoped to Prof Unit
            </span>
            <button
              onClick={() => setUserOpen(true)}
              className="h-7 rounded-md border border-grid bg-surface px-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
            >
              Add account
            </button>
          </span>
        </div>
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-[11px] border-t border-grid px-4 py-[11px]">
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-teal-700">
              {u.displayName.replace('Dr. ', '').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium">{u.displayName}</span>
              <span className="block font-mono text-[11px] text-ink-2">{u.email}</span>
            </span>
            <span
              className={`inline-flex h-5 items-center rounded px-2 text-[10px] font-bold tracking-[0.04em] ${ROLE_BADGE[u.role].cls}`}
            >
              {ROLE_BADGE[u.role].label}
            </span>
            <span className="hidden w-[280px] text-xs text-ink-2 xl:inline">
              {ROLE_POWERS[u.role]}
            </span>
          </div>
        ))}
      </Card>

      {/* ── Shift config ── */}
      <Card className="mt-3.5 overflow-hidden">
        <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
          <span className="text-[15px] font-semibold">Duty types & shift times</span>
          <span className="font-mono text-[11px] text-ink-2 uppercase">
            Pead defaults · configurable per department
          </span>
        </div>
        <div className="hidden gap-3 border-t border-grid px-4 py-2 text-[10px] font-semibold tracking-[0.04em] text-ink-3 md:flex">
          <span className="w-[150px]">DUTY</span>
          <span className="w-[92px]">LAYER</span>
          <span className="w-[230px]">SHIFT</span>
          <span className="w-11 text-right">HOURS</span>
          <span className="flex-1">RULE</span>
        </div>
        {SHIFTS.map((s) => (
          <div
            key={s.duty}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid px-4 py-2.5"
          >
            <span className="w-[150px] text-[13px] font-semibold">{s.duty}</span>
            <span className="w-[92px]">
              <span className="inline-flex h-[19px] items-center rounded bg-sunken px-[7px] text-[10px] font-bold tracking-[0.04em] text-ink-2">
                {s.layer}
              </span>
            </span>
            <span className="w-[230px] font-mono text-xs">{s.time}</span>
            <span className="w-11 text-right font-mono text-xs text-ink-2">{s.hours}</span>
            <span className="min-w-[160px] flex-1 text-xs text-ink-2">{s.note}</span>
          </div>
        ))}
      </Card>

      {/* ── Public holidays ── */}
      <HolidaysCard holidays={holidays} />

      {/* ── Modals ── */}
      {unitId && (
        <AddStaffModal
          open={addOpen}
          unitId={unitId}
          taken={pool.filter((s) => !s.activeUntil).map((s) => s.colorKey)}
          onClose={() => setAddOpen(false)}
          onDone={(name, from) => {
            setAddOpen(false)
            toast(`${name} added — counts start at 0 from ${from}`)
          }}
        />
      )}
      {seat && (
        <SeatModal
          open={seatOpen}
          holder={seat.currentHolder ?? ''}
          onClose={() => setSeatOpen(false)}
          onSave={(holder) =>
            updateStaff.mutate(
              { id: seat.id, currentHolder: holder },
              {
                onSuccess: () => {
                  setSeatOpen(false)
                  toast('Prof Unit holder updated — history stays with the seat')
                },
              },
            )
          }
        />
      )}
      <AddUserModal
        open={userOpen}
        unitId={unitId}
        onClose={() => setUserOpen(false)}
        onDone={(name) => {
          setUserOpen(false)
          toast(`Account created for ${name}`)
        }}
      />
    </div>
  )
}

function AddStaffModal({
  open,
  unitId,
  taken,
  onClose,
  onDone,
}: {
  open: boolean
  unitId: string
  taken: string[]
  onClose: () => void
  onDone: (name: string, from: string) => void
}) {
  const create = useCreateStaff()
  const toast = useToast()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<StaffKind>('RHO')
  const [pen, setPen] = useState<string | null>(null)
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))

  const save = () => {
    if (!name || !pen) {
      toast('Name and a free pen color are required')
      return
    }
    create.mutate(
      {
        unitId,
        kind,
        fullName: name,
        shortCode: code || name.slice(0, 1).toUpperCase(),
        colorKey: pen,
        activeFrom: new Date(`${from}T00:00:00Z`).toISOString(),
      },
      {
        onSuccess: () => {
          onDone(name, from)
          setName('')
          setCode('')
          setPen(null)
        },
        onError: () => toast('Could not add — is the short code or pen already taken?'),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Add to the SHO/RHO pool" width="w-[420px]">
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nilmini" />
          </Field>
        </div>
        <div className="w-[88px]">
          <Field label="Code">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 2))}
              placeholder="N"
              className="font-mono"
            />
          </Field>
        </div>
      </div>
      <div className="mt-3.5 flex gap-2.5">
        <div className="w-[130px]">
          <MiniLabel>Job title</MiniLabel>
          <div className="mt-1.5 flex gap-1">
            {(['SHO', 'RHO'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`h-8 flex-1 rounded-md border text-xs font-semibold ${
                  kind === k ? 'border-teal-600 bg-teal-50' : 'border-grid bg-surface'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-ink-3">Profile info only — one pool, same duties.</p>
        </div>
        <div className="flex-1">
          <MiniLabel>Pen color</MiniLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PEN_KEYS.map((k) => {
              const isTaken = taken.includes(k)
              return (
                <button
                  key={k}
                  title={isTaken ? 'Taken' : 'Available'}
                  disabled={isTaken}
                  onClick={() => setPen(k)}
                  className={`h-[26px] w-[26px] rounded-md border-2 ${
                    pen === k ? 'border-ink' : 'border-transparent'
                  } ${isTaken ? 'cursor-not-allowed opacity-25' : 'cursor-pointer'}`}
                  style={{ backgroundColor: `var(--color-${k}-dot)` }}
                />
              )
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-ink-3">
            Dimmed pens are taken. Doctors recognise their color before their letter.
          </p>
        </div>
      </div>
      <div className="mt-3.5">
        <MiniLabel>Active from</MiniLabel>
        <div className="mt-1.5 flex items-center gap-2.5">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-auto! font-mono text-[12.5px]"
          />
          <span className="text-[11px] text-ink-3">Counts start at 0 from this date.</span>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={create.isPending} onClick={save}>
          Add to pool
        </Button>
      </div>
    </Modal>
  )
}

function SeatModal({
  open,
  holder,
  onClose,
  onSave,
}: {
  open: boolean
  holder: string
  onClose: () => void
  onSave: (holder: string) => void
}) {
  const [draft, setDraft] = useState(holder)
  return (
    <Modal open={open} onClose={onClose} title="Change Prof Unit holder" width="w-[380px]">
      <p className="text-[12.5px] leading-normal text-ink-2">
        Casualty history and fairness counts stay with the Pu seat — only the name changes.
      </p>
      <div className="mt-3.5">
        <Field label="New holder">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
        </Field>
      </div>
      <div className="mt-[18px] flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onSave(draft || holder)}>Save</Button>
      </div>
    </Modal>
  )
}

function AddUserModal({
  open,
  unitId,
  onClose,
  onDone,
}: {
  open: boolean
  unitId: string | undefined
  onClose: () => void
  onDone: (name: string) => void
}) {
  const create = useCreateUser()
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('SHO_EDITOR')

  const save = () => {
    if (!name || !email || password.length < 8) {
      toast('Name, email and an 8+ character password are required')
      return
    }
    create.mutate(
      {
        email,
        password,
        displayName: name,
        role,
        unitId: role === 'ADMIN' ? null : unitId,
      },
      {
        onSuccess: () => {
          onDone(name)
          setName('')
          setEmail('')
          setPassword('')
        },
        onError: () => toast('Could not create the account — is the email already used?'),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Add an account" width="w-[400px]">
      <div className="flex flex-col gap-3">
        <Field label="Display name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Wasana" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@health.gov.lk"
          />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="CONSULTANT_EDITOR">Consultant roster editor</option>
            <option value="SHO_EDITOR">SHO/RHO roster editor</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={create.isPending} onClick={save}>
          Create account
        </Button>
      </div>
    </Modal>
  )
}

function HolidaysCard({
  holidays,
}: {
  holidays: { id: string; date: string; name: string }[]
}) {
  const create = useCreateHoliday()
  const remove = useDeleteHoliday()
  const toast = useToast()
  const [date, setDate] = useState('')
  const [name, setName] = useState('')

  return (
    <Card className="mt-3.5 overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
        <span className="text-[15px] font-semibold">Public holidays</span>
        <span className="font-mono text-[11px] text-ink-2 uppercase">
          Display flag on calendars · no roster rule
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t border-grid px-4 py-3">
        <div>
          <MiniLabel>Date</MiniLabel>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-auto! font-mono text-[12.5px]"
          />
        </div>
        <div className="min-w-[180px] flex-1">
          <MiniLabel>Name</MiniLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Poson Poya"
            className="mt-1.5"
          />
        </div>
        <Button
          variant="outline"
          disabled={create.isPending}
          onClick={() => {
            if (!date || !name) return
            create.mutate(
              { date, name },
              {
                onSuccess: () => {
                  setDate('')
                  setName('')
                  toast(`${name} added`)
                },
              },
            )
          }}
        >
          Add holiday
        </Button>
      </div>
      {holidays.map((h) => (
        <div key={h.id} className="flex items-center gap-3 border-t border-grid px-4 py-2">
          <span className="font-mono text-xs text-ink-2">
            {format(new Date(h.date), 'MMM dd, yyyy')}
          </span>
          <span className="flex-1 text-[13px]">{h.name}</span>
          <button
            onClick={() => remove.mutate(h.id, { onSuccess: () => toast('Holiday removed') })}
            className="h-6 w-6 rounded border border-grid text-xs text-ink-3 hover:border-danger hover:text-danger"
          >
            ×
          </button>
        </div>
      ))}
    </Card>
  )
}
