// Organisation — the SUPER_ADMIN / HOSPITAL_ADMIN view: hospitals, their
// admins, departments and department admins. Ward-level detail lives in
// Ward & staff.
import { useState } from 'react'
import { useMe } from '../../api/auth'
import {
  useCreateDepartment,
  useCreateHospital,
  useHospitals,
  useUsers,
  type AppUser,
  type Hospital,
} from '../../api/admin'
import { AccountModal } from '../../components/AccountModal'
import { Button, Card, Field, Input, MiniLabel, Modal, useToast } from '../../components/ui'
import { useScope } from '../../lib/scope'

export default function OrganisationPage() {
  const { data: me } = useMe()
  const { data: hospitals = [] } = useHospitals(!!me)
  const { data: users = [] } = useUsers()
  const { setHospitalId } = useScope()
  const toast = useToast()
  const isSuper = me?.role === 'SUPER_ADMIN'

  const [hospitalOpen, setHospitalOpen] = useState(false)
  const [account, setAccount] = useState<{
    role: 'HOSPITAL_ADMIN' | 'DEPARTMENT_ADMIN'
    hospitalId?: string
    departmentId?: string
    title: string
  } | null>(null)

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 md:px-7 md:py-[30px]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <MiniLabel>
            {isSuper ? 'Super admin · every hospital' : 'Hospital admin · your hospital'}
          </MiniLabel>
          <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
            Organisation
          </h1>
          <div className="mt-1.5 font-mono text-xs text-ink-2 uppercase">
            Hospitals → departments → wards · admins assigned at every level
          </div>
        </div>
        {isSuper && (
          <div className="pb-1">
            <Button onClick={() => setHospitalOpen(true)}>Add hospital</Button>
          </div>
        )}
      </div>

      {hospitals.map((h) => (
        <HospitalCard
          key={h.id}
          hospital={h}
          users={users}
          canManageHospital={isSuper}
          onView={() => {
            setHospitalId(h.id)
            toast(`Now viewing ${h.name} — every page follows the sidebar scope`)
          }}
          onAddHospitalAdmin={() =>
            setAccount({
              role: 'HOSPITAL_ADMIN',
              hospitalId: h.id,
              title: `Hospital admin · ${h.name}`,
            })
          }
          onAddDeptAdmin={(departmentId, name) =>
            setAccount({
              role: 'DEPARTMENT_ADMIN',
              departmentId,
              title: `Department admin · ${name}`,
            })
          }
        />
      ))}

      <AddHospitalModal
        open={hospitalOpen}
        onClose={() => setHospitalOpen(false)}
        onDone={(name) => {
          setHospitalOpen(false)
          toast(`${name} created — add its hospital admin next`)
        }}
      />
      {account && (
        <AccountModal
          open
          onClose={() => setAccount(null)}
          onDone={(name) => {
            setAccount(null)
            toast(`Account created for ${name}`)
          }}
          roles={[account.role]}
          hospitalId={account.hospitalId}
          departmentId={account.departmentId}
          title={account.title}
        />
      )}
    </div>
  )
}

function HospitalCard({
  hospital,
  users,
  canManageHospital,
  onView,
  onAddHospitalAdmin,
  onAddDeptAdmin,
}: {
  hospital: Hospital
  users: AppUser[]
  canManageHospital: boolean
  onView: () => void
  onAddHospitalAdmin: () => void
  onAddDeptAdmin: (departmentId: string, name: string) => void
}) {
  const createDept = useCreateDepartment()
  const toast = useToast()
  const [deptName, setDeptName] = useState('')

  const hospitalAdmins = users.filter(
    (u) => u.role === 'HOSPITAL_ADMIN' && u.hospitalId === hospital.id,
  )
  const wardCount = hospital.departments.reduce((n, d) => n + d.units.length, 0)

  return (
    <Card className="mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-[17px] pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="font-display text-[19px] font-semibold tracking-tight">
            {hospital.name}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-2 uppercase">
            {hospital.city ?? '—'} · {hospital.departments.length} department
            {hospital.departments.length === 1 ? '' : 's'} · {wardCount} ward
            {wardCount === 1 ? '' : 's'}
          </div>
        </div>
        <button
          onClick={onView}
          className="h-[30px] rounded-md border border-grid bg-surface px-3 text-xs font-semibold text-teal-700 hover:bg-teal-50"
        >
          View this hospital
        </button>
      </div>

      {/* Hospital admins */}
      <div className="flex flex-wrap items-center gap-2 border-t border-grid bg-sunken px-[17px] py-2.5">
        <span className="mr-label text-ink-3">Hospital admins</span>
        {hospitalAdmins.map((a) => (
          <span
            key={a.id}
            className="inline-flex h-6 items-center rounded-md border border-grid bg-surface px-2 text-xs font-semibold"
          >
            {a.displayName}
          </span>
        ))}
        {hospitalAdmins.length === 0 && <span className="text-xs text-ink-3">none yet</span>}
        <span className="flex-1" />
        {canManageHospital && (
          <button
            onClick={onAddHospitalAdmin}
            className="h-6 rounded-md border border-grid bg-surface px-2 text-[11px] font-semibold text-teal-700 hover:bg-teal-50"
          >
            + Assign admin
          </button>
        )}
      </div>

      {/* Departments */}
      {hospital.departments.map((d) => {
        const deptAdmins = users.filter(
          (u) => u.role === 'DEPARTMENT_ADMIN' && u.departmentId === d.id,
        )
        return (
          <div
            key={d.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid px-[17px] py-[11px]"
          >
            <span className="w-[160px] text-[13.5px] font-semibold">{d.name}</span>
            <span className="font-mono text-[11px] text-ink-2 uppercase">
              {d.units.length ? d.units.map((u) => u.name).join(' · ') : 'no wards yet'}
            </span>
            <span className="flex-1" />
            <span className="text-xs text-ink-2">
              {deptAdmins.length
                ? `Run by ${deptAdmins.map((a) => a.displayName).join(', ')}`
                : 'No department admin yet'}
            </span>
            <button
              onClick={() => onAddDeptAdmin(d.id, d.name)}
              className="h-6 rounded-md border border-grid bg-surface px-2 text-[11px] font-semibold text-teal-700 hover:bg-teal-50"
            >
              + Assign admin
            </button>
          </div>
        )
      })}

      {/* Add department */}
      <div className="flex flex-wrap items-center gap-2 border-t border-grid px-[17px] py-3">
        <Input
          value={deptName}
          onChange={(e) => setDeptName(e.target.value)}
          placeholder="New department name… (e.g. Surgery)"
          className="h-8! max-w-[280px]"
        />
        <Button
          variant="outline"
          disabled={!deptName || createDept.isPending}
          onClick={() =>
            createDept.mutate(
              { hospitalId: hospital.id, name: deptName },
              {
                onSuccess: () => {
                  toast(`${deptName} created — assign its department admin next`)
                  setDeptName('')
                },
                onError: () => toast('Could not create the department — name already used?'),
              },
            )
          }
        >
          Add department
        </Button>
        <span className="text-[11px] text-ink-3">
          Department admins then add wards, staff and roster types under Ward & staff.
        </span>
      </div>
    </Card>
  )
}

function AddHospitalModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: (name: string) => void
}) {
  const create = useCreateHospital()
  const toast = useToast()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Add a hospital" width="w-[380px]">
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Karapitiya Teaching Hospital"
          />
        </Field>
        <Field label="City (optional)">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Galle" />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!name || create.isPending}
          onClick={() =>
            create.mutate(
              { name, city: city || undefined },
              {
                onSuccess: () => {
                  onDone(name)
                  setName('')
                  setCity('')
                },
                onError: () => toast('Could not create the hospital'),
              },
            )
          }
        >
          Create hospital
        </Button>
      </div>
    </Modal>
  )
}
