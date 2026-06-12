import { useState } from 'react'
import { format } from 'date-fns'
import { useAudit, type AuditEntry } from '../api/rosters'
import { Button, Dialog } from '../components/ui'

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'bg-ok-bg text-ok',
  UPDATE: 'bg-draft-bg text-draft',
  SWAP: 'bg-postcash-bg text-postcash',
  PUBLISH: 'bg-ok-bg text-ok',
  REPUBLISH: 'bg-warn-bg text-warn',
  DELETE: 'bg-danger-bg text-danger',
}

export default function AuditPage() {
  const { data: entries = [], isLoading } = useAudit({ take: 200 })
  const [detail, setDetail] = useState<AuditEntry | null>(null)

  return (
    <div className="mx-auto max-w-280 px-4 py-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Audit trail</h1>
      <p className="mt-1 text-sm text-ink-soft">Every change: who, what, when.</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink-faint">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-grid bg-sheet">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-grid text-xs text-ink-soft">
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Who</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-grid last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink-soft">
                    {format(new Date(e.createdAt), 'd MMM yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-2.5">{e.user.displayName}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${ACTION_STYLE[e.action] ?? ''}`}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{e.entity}</td>
                  <td className="px-4 py-2.5 text-right">
                    {(e.before != null || e.after != null) && (
                      <Button variant="ghost" onClick={() => setDetail(e)}>
                        Diff
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Dialog open title={`${detail.action} · ${detail.entity}`} onClose={() => setDetail(null)}>
          <div className="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold text-ink-soft">Before</h3>
              <pre className="mt-1 overflow-x-auto rounded-md bg-paper p-2 font-mono text-xs">
                {detail.before != null ? JSON.stringify(detail.before, null, 2) : '—'}
              </pre>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-ink-soft">After</h3>
              <pre className="mt-1 overflow-x-auto rounded-md bg-paper p-2 font-mono text-xs">
                {detail.after != null ? JSON.stringify(detail.after, null, 2) : '—'}
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
