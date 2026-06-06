import { liveElapsedSec, itemRemainingSec } from './planModel.js'
import { formatRemaining } from '../../lib/format.js'

function DescLines({ desc }) {
  const lines = desc.split('\n').filter(Boolean)
  return (
    <div className="mb-2 space-y-0.5">
      {lines.map((l, i) =>
        l.startsWith('• ') ? (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-stone-300 text-[10px] mt-0.5 flex-shrink-0">☐</span>
            <span className="text-xs text-stone-400 leading-tight">{l.slice(2)}</span>
          </div>
        ) : (
          <p key={i} className="text-xs text-stone-400 leading-tight">{l}</p>
        )
      )}
    </div>
  )
}

const STATUS = {
  idle: { label: 'Idle', cls: 'bg-stone-100 text-stone-500' },
  running: { label: 'Running', cls: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Paused', cls: 'bg-amber-100 text-amber-700' },
  done: { label: 'Done', cls: 'bg-stone-800 text-white' },
}

export function PlanItemCard({ item, now, onClick, readOnly, onRemove }) {
  const elapsed = liveElapsedSec(item, now)
  const remaining = itemRemainingSec(item, now)
  const pct = Math.min(100, item.targetSec ? (elapsed / item.targetSec) * 100 : 0)
  const over = remaining < 0
  const isDone = item.status === 'done'
  const isRunning = item.status === 'running'
  const st = STATUS[item.status] || STATUS.idle

  return (
    <div className={`w-full text-left bg-white border rounded-2xl p-4 shadow-sm transition-all ${isRunning ? 'border-emerald-300' : 'border-stone-100'} ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <button
          disabled={readOnly || isDone || isRunning}
          onClick={onClick}
          className={`flex-1 text-left min-w-0 ${!readOnly && !isDone && !isRunning ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-semibold text-stone-800 ${isDone ? 'line-through text-stone-400' : ''}`}>{item.subjectName}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
          </div>
          {item.desc ? <DescLines desc={item.desc} /> : null}
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full rounded-full ${isDone ? 'bg-stone-400' : over ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-400">{Math.floor(elapsed / 60)}m / {Math.floor(item.targetSec / 60)}m</span>
            <span className={`tabular-nums font-semibold ${isDone ? 'text-stone-400' : over ? 'text-amber-600' : 'text-stone-700'}`}>{formatRemaining(remaining)}</span>
          </div>
          {item.logs?.length > 0 && (
            <p className="text-[11px] text-stone-400 mt-2 truncate">
              📝 {item.logs[item.logs.length - 1].note}
              {item.logs.length > 1 && <span className="ml-1 text-stone-300">+{item.logs.length - 1} more</span>}
            </p>
          )}
        </button>

        {!readOnly && !isRunning && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors mt-0.5"
            title="Remove item">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
