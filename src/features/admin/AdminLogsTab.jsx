import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { ChevronDown, ChevronUp, FileClock } from 'lucide-react'
import { firestore } from '../../lib/firebase.js'
import { SkeletonRows } from '../../components/Skeleton.jsx'

function relTime(ts) {
  const ms = ts?.toMillis ? ts.toMillis() : ts || 0
  if (!ms) return ''
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  return new Date(ms).toLocaleDateString()
}

export function AdminLogsTab({ currentUser }) {
  const [logs, setLogs] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [actionFilter, setActionFilter] = useState('')
  const [byMeOnly, setByMeOnly] = useState(false)

  useEffect(() => {
    const q = query(collection(firestore, 'adminLogs'), orderBy('at', 'desc'), limit(100))
    return onSnapshot(q, (snap) => setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
  }, [])

  const actionOptions = useMemo(() => [...new Set((logs || []).map((l) => l.action))].sort(), [logs])
  const visibleLogs = useMemo(() => {
    let list = logs || []
    if (actionFilter) list = list.filter((l) => l.action === actionFilter)
    if (byMeOnly) list = list.filter((l) => l.by === currentUser?.uid)
    return list
  }, [logs, actionFilter, byMeOnly, currentUser?.uid])

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-xs text-stone-400 shrink-0">{logs === null ? 'Loading…' : `${visibleLogs.length}/${logs.length} entries`}</p>
        {logs !== null && logs.length > 0 && (
          <>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="field-in w-auto text-xs ml-auto" aria-label="Filter by action type">
              <option value="">All actions</option>
              {actionOptions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={() => setByMeOnly((v) => !v)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border ${byMeOnly ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
              By me only
            </button>
          </>
        )}
      </div>
      {logs === null && <SkeletonRows count={4} height="h-14" />}
      {logs?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-300">
          <FileClock size={36} strokeWidth={1.2} />
          <p className="text-sm text-stone-400">No admin actions logged yet</p>
        </div>
      )}
      {logs && logs.length > 0 && visibleLogs.length === 0 && (
        <p className="text-sm text-stone-400 py-8 text-center">No entries match this filter</p>
      )}
      <div className="space-y-2">
        {visibleLogs.map((log) => {
          const expanded = expandedId === log.id
          return (
            <div key={log.id} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
              <button onClick={() => setExpandedId(expanded ? null : log.id)}
                className="w-full flex items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{log.action}</p>
                  <p className="text-xs text-stone-400 truncate">target: {log.target || '—'} · by {log.by}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-stone-400">
                  <span className="text-[10px]">{relTime(log.at)}</span>
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>
              {expanded && (
                <pre className="mt-3 text-[11px] bg-stone-50 rounded-xl p-3 overflow-x-auto text-stone-600">
                  {JSON.stringify(log.params || {}, null, 2)}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
