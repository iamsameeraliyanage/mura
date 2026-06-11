import { useState } from 'react'
import {
  ROLES,
  ROSTER_LAYERS,
  STAFF_KINDS,
  type Role,
  type RosterLayer,
  type StaffKind,
} from '../../../shared/types'
import {
  useCreateDepartment,
  useCreateHospital,
  useCreateUnit,
  useCreateUser,
  useDutyConfigs,
  useHospitals,
  useUpdateUser,
  useUpsertDutyConfig,
  type AppUser,
} from '../../api/admin'
import { Button, Dialog, Field, Input, Select } from '../../components/ui'
import { useUsers } from '../../api/admin'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-280 space-y-10 px-4 py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
      <OrgSection />
      <UsersSection />
      <DutyConfigSection />
    </div>
  )
}

// ── Org hierarchy ──

function OrgSection() {
  const { data: hospitals = [] } = useHospitals()
  const createHospital = useCreateHospital()
  const createDepartment = useCreateDepartment()
  const createUnit = useCreateUnit()
  const [adding, setAdding] = useState<
    | { kind: 'hospital' }
    | { kind: 'department'; hospitalId: string }
    | { kind: 'unit'; departmentId: string }
    | null
  >(null)
  const [name, setName] = useState('')

  const submit = () => {
    if (!adding) return
    const done = {
      onSuccess: () => {
        setAdding(null)
        setName('')
      },
    }
    if (adding.kind === 'hospital') createHospital.mutate({ name }, done)
    if (adding.kind === 'department')
      createDepartment.mutate({ hospitalId: adding.hospitalId, name }, done)
    if (adding.kind === 'unit') createUnit.mutate({ departmentId: adding.departmentId, name }, done)
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hospitals & departments</h2>
        <Button variant="ghost" onClick={() => setAdding({ kind: 'hospital' })}>
          Add hospital
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {hospitals.map((h) => (
          <div key={h.id} className="rounded-lg border border-grid bg-sheet p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{h.name}</span>
              <Button
                variant="ghost"
                onClick={() => setAdding({ kind: 'department', hospitalId: h.id })}
              >
                Add department
              </Button>
            </div>
            {h.departments.map((d) => (
              <div key={d.id} className="mt-2 ml-4 border-l-2 border-grid pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{d.name}</span>
                  <Button
                    variant="ghost"
                    onClick={() => setAdding({ kind: 'unit', departmentId: d.id })}
                  >
                    Add unit
                  </Button>
                </div>
                <ul className="mt-1 ml-4 list-disc text-sm text-ink-soft">
                  {d.units.map((u) => (
                    <li key={u.id}>{u.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      {adding && (
        <Dialog open title={`Add ${adding.kind}`} onClose={() => setAdding(null)}>
          <div className="space-y-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAdding(null)}>
                Cancel
              </Button>
              <Button disabled={!name} onClick={submit}>
                Create
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  )
}

// ── Users ──

function UsersSection() {
  const { data: users = [] } = useUsers()
  const { data: hospitals = [] } = useHospitals()
  const [editing, setEditing] = useState<AppUser | 'new' | null>(null)

  const units = hospitals.flatMap((h) =>
    h.departments.flatMap((d) => d.units.map((u) => ({ ...u, label: `${d.name} · ${u.name}` }))),
  )

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <Button variant="ghost" onClick={() => setEditing('new')}>
          Add user
        </Button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-grid bg-sheet">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-grid text-xs text-ink-soft">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Unit</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-grid last:border-0">
                <td className="px-4 py-2.5">{u.displayName}</td>
                <td className="px-4 py-2.5 text-ink-soft">{u.email}</td>
                <td className="px-4 py-2.5 text-ink-soft">{u.role}</td>
                <td className="px-4 py-2.5 text-ink-soft">
                  {units.find((x) => x.id === u.unitId)?.label ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button variant="ghost" onClick={() => setEditing(u)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <UserDialog
          user={editing === 'new' ? null : editing}
          units={units}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

function UserDialog({
  user,
  units,
  onClose,
}: {
  user: AppUser | null
  units: { id: string; label: string }[]
  onClose: () => void
}) {
  const create = useCreateUser()
  const update = useUpdateUser()
  const [form, setForm] = useState({
    email: user?.email ?? '',
    displayName: user?.displayName ?? '',
    role: user?.role ?? ('SHO_EDITOR' as Role),
    unitId: user?.unitId ?? units[0]?.id ?? '',
    password: '',
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  const needsUnit = form.role !== 'ADMIN'

  const submit = () => {
    const done = { onSuccess: onClose }
    const unitId = needsUnit ? form.unitId : null
    if (user) {
      update.mutate(
        {
          id: user.id,
          displayName: form.displayName,
          role: form.role,
          unitId,
          ...(form.password ? { password: form.password } : {}),
        },
        done,
      )
    } else {
      create.mutate(
        {
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          role: form.role,
          unitId,
        },
        done,
      )
    }
  }

  return (
    <Dialog open title={user ? `Edit ${user.displayName}` : 'Add user'} onClose={onClose}>
      <div className="space-y-3">
        {!user && (
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Field>
        )}
        <Field label="Display name">
          <Input value={form.displayName} onChange={(e) => set({ displayName: e.target.value })} />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={(e) => set({ role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        {needsUnit && (
          <Field label="Unit scope">
            <Select value={form.unitId} onChange={(e) => set({ unitId: e.target.value })}>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={user ? 'New password (blank = keep)' : 'Password (min 8 chars)'}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !form.displayName ||
              (!user && (!form.email || form.password.length < 8)) ||
              create.isPending ||
              update.isPending
            }
          >
            {user ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

// ── Duty config ──

function DutyConfigSection() {
  const { data: hospitals = [] } = useHospitals()
  const { data: configs = [] } = useDutyConfigs()
  const upsert = useUpsertDutyConfig()
  const [editing, setEditing] = useState<{ unitId: string; layer: RosterLayer } | null>(null)
  const [configText, setConfigText] = useState('')
  const [poolKinds, setPoolKinds] = useState<StaffKind[]>([])
  const [jsonError, setJsonError] = useState<string | null>(null)

  const units = hospitals.flatMap((h) =>
    h.departments.flatMap((d) => d.units.map((u) => ({ ...u, label: `${d.name} · ${u.name}` }))),
  )

  const openEditor = (unitId: string, layer: RosterLayer) => {
    const existing = configs.find((c) => c.unitId === unitId && c.layer === layer)
    setConfigText(JSON.stringify(existing?.config ?? {}, null, 2))
    setPoolKinds(existing?.poolKinds ?? (layer === 'CONSULTANT' ? ['CONSULTANT'] : ['SHO', 'RHO']))
    setJsonError(null)
    setEditing({ unitId, layer })
  }

  const save = () => {
    if (!editing) return
    let config: Record<string, unknown>
    try {
      config = JSON.parse(configText)
    } catch {
      setJsonError('Invalid JSON')
      return
    }
    upsert.mutate({ ...editing, config, poolKinds }, { onSuccess: () => setEditing(null) })
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Duty configuration</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Shift times and pool composition per unit and roster layer.
      </p>
      <div className="mt-3 space-y-2">
        {units.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-lg border border-grid bg-sheet px-4 py-3"
          >
            <span className="text-sm font-medium">{u.label}</span>
            <div className="flex gap-2">
              {ROSTER_LAYERS.map((layer) => (
                <Button key={layer} variant="ghost" onClick={() => openEditor(u.id, layer)}>
                  {layer} config
                  {configs.some((c) => c.unitId === u.id && c.layer === layer) ? '' : ' (new)'}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Dialog open title={`${editing.layer} duty config`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Pool kinds (who can be assigned)">
              <div className="flex flex-wrap gap-3">
                {STAFF_KINDS.map((k) => (
                  <label key={k} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={poolKinds.includes(k)}
                      onChange={(e) =>
                        setPoolKinds((prev) =>
                          e.target.checked ? [...prev, k] : prev.filter((x) => x !== k),
                        )
                      }
                    />
                    {k}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Config (JSON — shift times etc.)">
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-grid bg-paper px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500"
              />
            </Field>
            {jsonError && (
              <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{jsonError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={poolKinds.length === 0 || upsert.isPending}>
                Save
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  )
}
