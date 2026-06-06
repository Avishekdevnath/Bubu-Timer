import { liveElapsedSec, itemRemainingSec } from './planModel.js'
import { formatRemaining } from '../../lib/format.js'

const STATUS = {
  idle: { label: 'Idle', cls: 'bg-stone-100 text-stone-500' },
  running: { label: 'Running', cls: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Paused', cls: 'bg-amber-100 text-amber-700' },
  done: { label: 'Done', cls: 'bg-stone-800 text-white' },
}

export function PlanItemCard({ item, now, onClick, readOnly }) {
  const elapsed = liveElapsedSec(item, now)
  const remaining = itemRemainingSec(item, now)
  const pct = Math.min(100, item.targetSec ? (elapsed / item.targetSec) * 100 : 0)
  const over = remaining < 0
  const st = STATUS[item.status] || STATUS.idle
  return (
    <button disabled={readOnly || item.status === 'done'} onClick={onClick}
      className={`w-full text-left bg-white border rounded-2xl p-4 shadow-sm transition-colors ${item.status === 'running' ? 'border-emerald-300' : 'border-stone-100'} ${readOnly ? 'cursor-default' : 'hover:bg-stone-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-stone-800">{item.subjectName}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
      </div>
      {item.desc ? <p className="text-xs text-stone-400 mb-2">{item.desc}</p> : null}
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1.5">
        <div className={`h-full rounded-full ${over ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-stone-400">{Math.floor(elapsed / 60)}m / {Math.floor(item.targetSec / 60)}m</span>
        <span className={`tabular-nums font-semibold ${over ? 'text-amber-600' : 'text-stone-700'}`}>{formatRemaining(remaining)}</span>
      </div>
      {item.logs?.length ? <p className="text-[11px] text-stone-400 mt-2 truncate">📝 {item.logs[item.logs.length - 1].note}</p> : null}
    </button>
  )
}
