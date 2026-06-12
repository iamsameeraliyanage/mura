// Create-an-account modal shared by Organisation and Ward & staff. The caller
// fixes the scope (hospital/department/ward) — the modal collects identity,
// role and, for roster admins, which rosters they run + an optional link to
// the staff member they are.
import { useState } from 'react'
import { ROLE_LABELS, type Role, type RosterLayer } from '../../shared/types'
import { useCreateUser, type Staff } from '../api/admin'
import { NAV_LAYER_LABELS } from './AppShell'
import { Button, Field, Input, Modal, Select, useToast } from './ui'

export function AccountModal({
  open,
  onClose,
  onDone,
  roles,
  hospitalId,
  departmentId,
  unitId,
  layers = [],
  staff = [],
  title = 'Add an account',
}: {
  open: boolean
  onClose: () => void
  onDone: (name: string) => void
  roles: Role[] // which roles the signed-in admin may grant in this context
  hospitalId?: string
  departmentId?: string
  unitId?: string
  layers?: RosterLayer[] // roster types of the ward (ROSTER_ADMIN choices)
  staff?: Staff[] // ward staff a roster admin can be linked to
  title?: string
}) {
  const create = useCreateUser()
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(roles[0])
  const [picked, setPicked] = useState<RosterLayer[]>([])
  const [staffId, setStaffId] = useState('')

  const toggleLayer = (l: RosterLayer) =>
    setPicked((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]))

  const save = () => {
    if (!name || !email || password.length < 8) {
      toast('Name, email and an 8+ character password are required')
      return
    }
    if (role === 'ROSTER_ADMIN' && picked.length === 0) {
      toast('Pick at least one roster for them to run')
      return
    }
    create.mutate(
      {
        email,
        password,
        displayName: name,
        role,
        hospitalId: role === 'HOSPITAL_ADMIN' ? hospitalId : undefined,
        departmentId: role === 'DEPARTMENT_ADMIN' ? departmentId : undefined,
        unitId: role === 'ROSTER_ADMIN' ? unitId : undefined,
        rosterLayers: role === 'ROSTER_ADMIN' ? picked : undefined,
        staffId: role === 'ROSTER_ADMIN' && staffId ? staffId : undefined,
      },
      {
        onSuccess: () => {
          onDone(name)
          setName('')
          setEmail('')
          setPassword('')
          setPicked([])
          setStaffId('')
        },
        onError: () => toast('Could not create the account — is the email already used?'),
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={title} width="w-[420px]">
      <div className="flex flex-col gap-3">
        {roles.length > 1 ? (
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="rounded-md bg-sunken px-3 py-2 text-[12.5px] font-semibold text-ink-2">
            {ROLE_LABELS[role]}
          </div>
        )}

        {role === 'ROSTER_ADMIN' && staff.length > 0 && (
          <Field label="Who is it? (optional — links the account to a staff member)">
            <Select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value)
                const member = staff.find((s) => s.id === e.target.value)
                if (member && !name) setName(member.fullName)
              }}
            >
              <option value="">Not in the pool</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.kind})
                </option>
              ))}
            </Select>
          </Field>
        )}

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

        {role === 'ROSTER_ADMIN' && (
          <div>
            <div className="mr-label mb-1.5 text-ink-3">Runs these rosters</div>
            <div className="flex flex-wrap gap-1.5">
              {layers.map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLayer(l)}
                  className={`h-8 rounded-md border px-3 text-xs font-semibold transition-colors ${
                    picked.includes(l)
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-grid bg-surface text-ink-2 hover:border-grid-strong'
                  }`}
                >
                  {NAV_LAYER_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        )}
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
