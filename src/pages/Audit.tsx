import { useState } from 'react'
import { format } from 'date-fns'
import { useAudit, type AuditEntry } from '../api/rosters'
import { Card, MiniLabel, Modal } from '../components/ui'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'publish', label: 'Publishes' },
  { key: 'swap', label: 'Swaps' },
  { key: 'generate', label: 'Generates' },
  { key: 'unavail', label: 'Unavailability' },
  { key: 'config', label: 'Config' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

const CONFIG_ENTITIES = [
  'StaffMember',
  'User',
  'DutyConfig',
  'PublicHoliday',
  'Hospital',
  'Department',
  'Unit',
]

function matches(entry: AuditEntry, filter: FilterKey): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'publish':
      return entry.action === 'PUBLISH' || entry.action === 'REPUBLISH'
    case 'swap':
      return entry.action === 'SWAP'
    case 'generate':
      return entry.entity === 'Roster' && (entry.action === 'CREATE' || entry.action === 'UPDATE')
    case 'unavail':
      return entry.entity === 'UnavailabilityDate'
    case 'config':
      return CONFIG_ENTITIES.includes(entry.entity)
  }
}

const ACTION_STYLE: Record<string, string> = {
  PUBLISH: 'bg-published-bg text-published',
  REPUBLISH: 'bg-published-bg text-published',
  SWAP: 'bg-teal-50 text-teal-700',
  CREATE: 'bg-draft-bg text-draft',
  UPDATE: 'bg-draft-bg text-draft',
  DELETE: 'bg-danger-bg text-danger',
}

const summarize = (v: unknown): string => {
  if (v == null) return '—'
  if (typeof v !== 'object') return String(v)
  const o = v as Record<string, unknown>
  if ('version' in o && 'status' in o) return `${o.status} v${o.version}`.toLowerCase()
  if ('generated' in o) return `${o.generated} slots`
  const s = JSON.stringify(v)
  return s.length > 26 ? `${s.slice(0, 26)}…` : s
}

export default function AuditPage() {
  const { data: entries = [], isLoading } = useAudit({ take: 200 })
  const [filter, setFilter] = useState<FilterKey>('all')
  const [detail, setDetail] = useState<AuditEntry | null>(null)

  const rows = entries.filter((e) => matches(e, filter))

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-6 md:px-7 md:py-[30px]">
      <MiniLabel>Audit trail · every change, forever</MiniLabel>
      <h1 className="mt-1.5 font-display text-[28px] leading-[1.1] font-semibold tracking-tight md:text-4xl">
        Who changed what, when
      </h1>
      <div className="mt-1.5 font-mono text-xs text-ink-2 uppercase">
        {rows.length} of {entries.length} entries
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`h-[30px] rounded-md border px-3 text-[12.5px] font-semibold transition-colors hover:border-teal-600 ${
              filter === f.key
                ? 'border-teal-600 bg-teal-50 text-teal-700'
                : 'border-grid bg-surface text-ink-2'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="hidden gap-3 border-b border-grid px-4 py-2 text-[10px] font-semibold tracking-[0.04em] text-ink-3 md:flex">
          <span className="w-[120px]">WHEN</span>
          <span className="w-[120px]">WHO</span>
          <span className="w-[86px]">ACTION</span>
          <span className="flex-1">DETAIL</span>
          <span className="w-[150px]">BEFORE → AFTER</span>
        </div>
        {isLoading && <p className="px-4 py-6 text-sm text-ink-3">Loading…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-2">Nothing here yet.</p>
        )}
        {rows.map((e) => (
          <button
            key={e.id}
            onClick={() => setDetail(e)}
            className="flex w-full flex-wrap items-start gap-x-3 gap-y-1 border-b border-grid px-4 py-3 text-left transition-colors last:border-0 hover:bg-sunken"
          >
            <span className="w-[120px] pt-0.5 font-mono text-[11.5px] text-ink-2">
              {format(new Date(e.createdAt), 'MMM d, HH:mm')}
            </span>
            <span className="w-[120px] min-w-0">
              <span className="block truncate text-[13px] font-semibold">
                {e.user.displayName}
              </span>
              <span className="block text-[10.5px] whitespace-nowrap text-ink-3">
                {e.user.role.replace('_', ' ').toLowerCase()}
              </span>
            </span>
            <span className="w-[86px] pt-px">
              <span
                className={`inline-flex h-5 items-center rounded px-2 text-[10px] font-bold tracking-[0.04em] ${
                  ACTION_STYLE[e.action] ?? 'bg-sunken text-ink-2'
                }`}
              >
                {e.action}
              </span>
            </span>
            <span className="min-w-[140px] flex-1 text-[13px] leading-snug">
              {e.entity}
              <span className="mt-0.5 block text-[11.5px] text-ink-2">{e.entityId}</span>
            </span>
            <span className="w-[150px] pt-0.5 font-mono text-[11.5px] text-ink-2">
              <span className="text-danger line-through decoration-1">{summarize(e.before)}</span>
              <span className="text-ink-3"> → </span>
              <span className="font-bold text-published">{summarize(e.after)}</span>
            </span>
          </button>
        ))}
      </Card>
      <p className="mt-3 text-[11.5px] text-ink-3">
        Audit rows are written on every mutation and are never deleted — they survive staff
        turnover and roster re-publishes.
      </p>

      {detail && (
        <Modal
          open
          onClose={() => setDetail(null)}
          title={`${detail.action} · ${detail.entity}`}
          width="w-[560px]"
        >
          <div className="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
            <div>
              <MiniLabel>Before</MiniLabel>
              <pre className="mt-1 overflow-x-auto rounded-md bg-sunken p-2 font-mono text-xs">
                {detail.before != null ? JSON.stringify(detail.before, null, 2) : '—'}
              </pre>
            </div>
            <div>
              <MiniLabel>After</MiniLabel>
              <pre className="mt-1 overflow-x-auto rounded-md bg-sunken p-2 font-mono text-xs">
                {detail.after != null ? JSON.stringify(detail.after, null, 2) : '—'}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
