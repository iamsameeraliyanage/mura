// Ward & staff — the DEPARTMENT_ADMIN's home: wards, staff, roster types
// (DutyConfig rows) and the roster-admin accounts that run them.
import { useState } from 'react'
import { format } from 'date-fns'
import {
  LAYER_DEFAULT_POOL,
  ROLE_LABELS,
  ROSTER_LAYERS,
  STAFF_KINDS,
  type Role,
  type RosterLayer,
  type StaffKind,
} from '../../../shared/types'
import { useMe } from '../../api/auth'
import {
  useCreateHoliday,
  useCreateStaff,
  useCreateUnit,
  useDeleteDutyConfig,
  useDeleteHoliday,
  useDutyConfigs,
  useHolidays,
  useStaff,
  useUpdateStaff,
  useUpsertDutyConfig,
  useUsers,
  type AppUser,
  type DutyConfig,
  type Staff,
} from '../../api/admin'
import { AccountModal } from '../../components/AccountModal'
import { NAV_LAYER_LABELS } from '../../components/AppShell'
import {
  Button,
  Card,
  Field,
  Input,
  MiniLabel,
  Modal,
  PEN_KEYS,
  PenChip,
  useToast,
} from '../../components/ui'
import { useScope } from '../../lib/scope'

const SHIFTS = [
  {
    duty: 'On-call',
    layer: 'Pool',
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

const ROLE_BADGE: Record<Role, string> = {
  SUPER_ADMIN: 'bg-sunken text-ink-2',
  HOSPITAL_ADMIN: 'bg-postcash-bg text-postcash',
  DEPARTMENT_ADMIN: 'bg-draft-bg text-draft',
  ROSTER_ADMIN: 'bg-published-bg text-published',
}

export default function StaffPage() {
  const { data: me } = useMe()
  const { hospital, department, unit, setUnitId } = useScope()
  const unitId = unit?.id
  const toast = useToast()
  const { data: staff = [] } = useStaff(unitId)
  const { data: users = [] } = useUsers()
  const { data: holidays = [] } = useHolidays()
  const { data: configs = [] } = useDutyConfigs(unitId)
  const updateStaff = useUpdateStaff()

  const [addOpen, setAddOpen] = useState(false)
  const [seatOpen, setSeatOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)

  const seat = staff.find((s) => s.isSeat)
  const consultants = staff.filter((s) => s.kind === 'CONSULTANT')

  // One staff card per pool roster type, plus a card for anyone left over.
  const poolConfigs = configs.filter((c) => c.layer !== 'CONSULTANT')
  const pooled = new Set(
    poolConfigs.flatMap((c) => staff.filter((s) => c.poolKinds.includes(s.kind)).map((s) => s.id)),
  )
  const other = staff.filter((s) => s.kind !== 'CONSULTANT' && !pooled.has(s.id))

  const accountRoles: Role[] =
    me?.role === 'DEPARTMENT_ADMIN' ? ['ROSTER_ADMIN'] : ['ROSTER_ADMIN', 'DEPARTMENT_ADMIN']

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 md:px-7 md:py-[30px]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <MiniLabel>
            Admin · {[hospital?.name, department?.name, unit?.name].filter(Boolean).join(' → ')}
          </MiniLabel>
          <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
            Ward & staff
          </h1>
        </div>
        <div className="pb-1">
          <Button onClick={() => setAddOpen(true)}>Add staff</Button>
        </div>
      </div>

      {/* ── Wards of this department ── */}
      {department && (
        <WardsCard
          departmentId={department.id}
          units={department.units}
          activeUnitId={unitId}
          onSelect={setUnitId}
        />
      )}

      {/* ── Roster types of this ward ── */}
      <Card className="mt-3.5 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3.5 pb-2.5">
          <span className="text-[15px] font-semibold">Roster types</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              Each gets its own calendar, generator & fairness
            </span>
            <button
              onClick={() => setTypeOpen(true)}
              className="h-7 rounded-md border border-grid bg-surface px-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
            >
              Add roster type
            </button>
          </span>
        </div>
        {configs.map((cfg) => (
          <RosterTypeRow
            key={cfg.id}
            cfg={cfg}
            admins={users.filter(
              (u) =>
                u.role === 'ROSTER_ADMIN' &&
                u.unitId === unitId &&
                u.rosterLayers.includes(cfg.layer),
            )}
          />
        ))}
        {configs.length === 0 && (
          <p className="border-t border-grid px-4 py-5 text-sm text-ink-2">
            No roster types yet — add one (e.g. SHO/RHO on-call or a Nurses roster) and it
            appears in everyone's sidebar.
          </p>
        )}
      </Card>

      {/* ── Prof Unit seat ── */}
      {seat && (
        <Card className="mt-3.5 p-[17px]">
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
              <div className="mt-0.5 text-[13.5px] font-semibold">{seat.currentHolder ?? '—'}</div>
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
        {consultants.length > 0 && (
          <StaffTable
            title="Consultant layer"
            caption={`${consultants.length} seats`}
            members={consultants}
          />
        )}
        {poolConfigs.map((cfg) => {
          const members = staff.filter((s) => cfg.poolKinds.includes(s.kind))
          const active = members.filter((s) => !s.activeUntil)
          return (
            <StaffTable
              key={cfg.id}
              title={`${NAV_LAYER_LABELS[cfg.layer].replace(' roster', '')} pool`}
              caption={`Pool of ${active.length} · ${cfg.poolKinds.join(' + ')}`}
              members={members}
              footer="New members start their fairness counts at 0 — history of leavers is kept permanently."
            />
          )
        })}
        {other.length > 0 && (
          <StaffTable
            title="Other staff"
            caption="Not in any roster pool yet"
            members={other}
            footer="Add a roster type whose pool includes their job title to roster them."
          />
        )}
      </div>

      {/* ── Accounts ── */}
      <Card className="mt-3.5 overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3.5 pb-2.5">
          <span className="text-[15px] font-semibold">Accounts</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              No self-signup · each scoped to their level
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
          <UserRow key={u.id} user={u} />
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
          taken={staff.filter((s) => !s.activeUntil).map((s) => s.colorKey)}
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
      <AccountModal
        open={userOpen}
        onClose={() => setUserOpen(false)}
        onDone={(name) => {
          setUserOpen(false)
          toast(`Account created for ${name}`)
        }}
        roles={accountRoles}
        departmentId={department?.id}
        unitId={unitId}
        layers={configs.map((c) => c.layer)}
        staff={staff.filter((s) => !s.isSeat && !s.activeUntil)}
      />
      {unitId && (
        <AddRosterTypeModal
          open={typeOpen}
          unitId={unitId}
          existing={configs.map((c) => c.layer)}
          onClose={() => setTypeOpen(false)}
          onDone={(layer) => {
            setTypeOpen(false)
            toast(`${NAV_LAYER_LABELS[layer]} created — it's in the sidebar now`)
          }}
        />
      )}
    </div>
  )
}

function WardsCard({
  departmentId,
  units,
  activeUnitId,
  onSelect,
}: {
  departmentId: string
  units: { id: string; name: string }[]
  activeUnitId: string | undefined
  onSelect: (id: string) => void
}) {
  const create = useCreateUnit()
  const toast = useToast()
  const [name, setName] = useState('')
  return (
    <Card className="mt-6 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <MiniLabel className="text-ink-3!">Wards</MiniLabel>
        <span className="flex-1" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New ward name…"
          className="h-8! w-44!"
        />
        <Button
          variant="outline"
          disabled={!name || create.isPending}
          onClick={() =>
            create.mutate(
              { departmentId, name },
              {
                onSuccess: () => {
                  toast(`${name} created`)
                  setName('')
                },
                onError: () => toast('Could not create the ward — name already used?'),
              },
            )
          }
        >
          Add ward
        </Button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {units.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u.id)}
            className={`h-8 rounded-md border px-3 text-[12.5px] font-semibold transition-colors ${
              u.id === activeUnitId
                ? 'border-teal-600 bg-teal-50 text-teal-700'
                : 'border-grid bg-surface text-ink-2 hover:border-grid-strong'
            }`}
          >
            {u.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-3">
        Everything below — staff, roster types, accounts — belongs to the selected ward.
      </p>
    </Card>
  )
}

function RosterTypeRow({ cfg, admins }: { cfg: DutyConfig; admins: AppUser[] }) {
  const remove = useDeleteDutyConfig()
  const toast = useToast()
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid px-4 py-[11px]">
      <span className="w-[180px] text-[13.5px] font-semibold">{NAV_LAYER_LABELS[cfg.layer]}</span>
      <span className="flex gap-1">
        {cfg.poolKinds.map((k) => (
          <span
            key={k}
            className="inline-flex h-[19px] items-center rounded bg-sunken px-[7px] text-[10px] font-bold tracking-[0.04em] text-ink-2"
          >
            {k}
          </span>
        ))}
      </span>
      <span className="min-w-[140px] flex-1 text-xs text-ink-2">
        {admins.length
          ? `Run by ${admins.map((a) => a.displayName).join(', ')}`
          : 'No roster admin yet — the department admin runs it'}
      </span>
      <button
        title="Remove roster type"
        onClick={() =>
          remove.mutate(cfg.id, {
            onSuccess: () => toast('Roster type removed'),
            onError: (err) =>
              toast(
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                  'Could not remove',
              ),
          })
        }
        className="h-6 w-6 rounded border border-grid text-xs text-ink-3 hover:border-danger hover:text-danger"
      >
        ×
      </button>
    </div>
  )
}

function StaffTable({
  title,
  caption,
  members,
  footer,
}: {
  title: string
  caption: string
  members: Staff[]
  footer?: string
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="font-mono text-[11px] text-ink-2 uppercase">{caption}</span>
      </div>
      {members.map((s) => (
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
            <span className="block truncate text-[13.5px] font-medium">
              {s.isSeat && s.currentHolder ? `${s.fullName} — ${s.currentHolder}` : s.fullName}
            </span>
            <span className="block text-[11px] text-ink-2">
              {s.isSeat ? 'Seat · holder can change' : s.kind}
            </span>
          </span>
          <span className="font-mono text-[11px] whitespace-nowrap text-ink-2 uppercase">
            {format(new Date(s.activeFrom), 'MMM yyyy')} →
            {s.activeUntil ? ` ${format(new Date(s.activeUntil), 'MMM yyyy')}` : ''}
          </span>
        </div>
      ))}
      {footer && (
        <div className="border-t border-grid bg-sunken px-4 py-2.5 text-[11.5px] leading-normal text-ink-2">
          {footer}
        </div>
      )}
    </Card>
  )
}

function UserRow({ user }: { user: AppUser }) {
  const scopeLine =
    user.role === 'ROSTER_ADMIN'
      ? `Runs ${user.rosterLayers.map((l) => NAV_LAYER_LABELS[l].replace(' roster', '')).join(', ') || '—'}`
      : user.role === 'DEPARTMENT_ADMIN'
        ? 'Wards, staff, roster types & roster admins'
        : user.role === 'HOSPITAL_ADMIN'
          ? 'Departments & department admins'
          : 'Everything, every hospital'
  return (
    <div className="flex flex-wrap items-center gap-[11px] border-t border-grid px-4 py-[11px]">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-teal-700">
        {user.displayName.replace('Dr. ', '').slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium">{user.displayName}</span>
        <span className="block font-mono text-[11px] text-ink-2">{user.email}</span>
      </span>
      <span
        className={`inline-flex h-5 items-center rounded px-2 text-[10px] font-bold tracking-[0.04em] uppercase ${ROLE_BADGE[user.role]}`}
      >
        {ROLE_LABELS[user.role]}
      </span>
      <span className="hidden w-[280px] text-xs text-ink-2 xl:inline">{scopeLine}</span>
    </div>
  )
}

function AddRosterTypeModal({
  open,
  unitId,
  existing,
  onClose,
  onDone,
}: {
  open: boolean
  unitId: string
  existing: RosterLayer[]
  onClose: () => void
  onDone: (layer: RosterLayer) => void
}) {
  const upsert = useUpsertDutyConfig()
  const toast = useToast()
  const available = ROSTER_LAYERS.filter((l) => !existing.includes(l))
  const [layer, setLayer] = useState<RosterLayer | null>(null)
  const [kinds, setKinds] = useState<StaffKind[]>([])

  const pick = (l: RosterLayer) => {
    setLayer(l)
    setKinds(LAYER_DEFAULT_POOL[l])
  }
  const toggleKind = (k: StaffKind) =>
    setKinds((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))

  const save = () => {
    if (!layer || kinds.length === 0) {
      toast('Pick a roster type and at least one job title for its pool')
      return
    }
    upsert.mutate(
      { unitId, layer, poolKinds: kinds, config: { timezone: 'Asia/Colombo' } },
      {
        onSuccess: () => {
          onDone(layer)
          setLayer(null)
        },
        onError: () => toast('Could not create the roster type'),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a roster type" width="w-[420px]">
      {available.length === 0 ? (
        <p className="text-sm text-ink-2">Every roster type already exists for this ward.</p>
      ) : (
        <>
          <MiniLabel>Roster</MiniLabel>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {available.map((l) => (
              <button
                key={l}
                onClick={() => pick(l)}
                className={`h-8 rounded-md border px-3 text-xs font-semibold ${
                  layer === l ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-grid bg-surface'
                }`}
              >
                {NAV_LAYER_LABELS[l]}
              </button>
            ))}
          </div>
          <div className="mt-3.5">
            <MiniLabel>Who is in the pool</MiniLabel>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STAFF_KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => toggleKind(k)}
                  className={`h-8 rounded-md border px-3 text-xs font-semibold ${
                    kinds.includes(k)
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-grid bg-surface text-ink-2'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-ink-3">
              Staff with these job titles share one pool and one fairness count (Pead combines SHO
              + RHO).
            </p>
          </div>
        </>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {available.length > 0 && (
          <Button disabled={upsert.isPending} onClick={save}>
            Create roster type
          </Button>
        )}
      </div>
    </Modal>
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
    <Modal open={open} onClose={onClose} title="Add a staff member" width="w-[420px]">
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
      <div className="mt-3.5">
        <MiniLabel>Job title</MiniLabel>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {STAFF_KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`h-8 rounded-md border px-2.5 text-xs font-semibold ${
                kind === k ? 'border-teal-600 bg-teal-50' : 'border-grid bg-surface'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-ink-3">
          The job title decides which roster pools they join.
        </p>
      </div>
      <div className="mt-3.5">
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
          Add staff member
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

function HolidaysCard({ holidays }: { holidays: { id: string; date: string; name: string }[] }) {
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
