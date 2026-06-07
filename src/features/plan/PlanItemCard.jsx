import { useState } from 'react'
import { liveElapsedSec, itemRemainingSec } from './planModel.js'
import { formatRemaining, formatStudyMinutes } from '../../lib/format.js'

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
  idle:    { label: 'Idle',    cls: 'bg-stone-100 text-stone-500' },
  running: { label: 'Running', cls: 'bg-emerald-100 text-emerald-700' },
  paused:  { label: 'Paused',  cls: 'bg-amber-100 text-amber-700' },
  done:    { label: 'Done',    cls: 'bg-stone-800 text-white' },
}

export function PlanItemCard({ item, now, onStart, onPause, onDone, readOnly, onRemove, activeItemId }) {
  const [expanded, setExpanded] = useState(false)
  const elapsed   = liveElapsedSec(item, now)
  const remaining = itemRemainingSec(item, now)
  const pct       = Math.min(100, item.targetSec ? (elapsed / item.targetSec) * 100 : 0)
  const over      = remaining < 0
  const isDone    = item.status === 'done'
  const isRunning = item.status === 'running'
  const isPaused  = item.status === 'paused'
  const otherRunning = !!(activeItemId && activeItemId !== item.id)
  const st        = STATUS[item.status] || STATUS.idle

  return (
    <div className={`w-full bg-white border rounded-2xl shadow-sm transition-all ${isRunning ? 'border-emerald-300' : 'border-stone-100'} ${isDone ? 'opacity-60' : ''}`}>

      {/* Tappable header — expand/collapse */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-4 pt-4 pb-3"
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold text-stone-800 ${isDone ? 'line-through text-stone-400' : ''}`}>
            {item.subjectName}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
            {!readOnly && !isRunning && onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-red-400"
              >✕</button>
            )}
          </div>
        </div>

        {item.desc ? <DescLines desc={item.desc} /> : null}

        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full ${isDone ? 'bg-stone-400' : over ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-stone-400">
            {formatStudyMinutes(Math.floor(elapsed / 60))} / {formatStudyMinutes(Math.floor(item.targetSec / 60))}
          </span>
          <span className={`tabular-nums font-semibold ${isDone ? 'text-stone-400' : over ? 'text-amber-600' : 'text-stone-700'}`}>
            {formatRemaining(remaining)}
          </span>
        </div>
      </button>

      {/* Logs */}
      {item.logs?.length > 0 && (
        <div className="px-4 pb-2 space-y-1">
          {expanded
            ? item.logs.map((log, i) => (
                <p key={i} className="text-[11px] text-stone-400">📝 {log.note}</p>
              ))
            : (
              <p className="text-[11px] text-stone-400 truncate">
                📝 {item.logs[item.logs.length - 1].note}
                {item.logs.length > 1 && (
                  <span className="ml-1 text-stone-300">+{item.logs.length - 1} more</span>
                )}
              </p>
            )
          }
        </div>
      )}

      {/* Action buttons */}
      {!readOnly && !isDone && (
        <div className="px-4 pb-3 pt-1 flex gap-2">
          {isRunning ? (
            <>
              <button
                onClick={onPause}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold"
              >
                Pause &amp; Log
              </button>
              <button
                onClick={onDone}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold"
              >
                Mark Done
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              disabled={otherRunning}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                otherRunning
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : isPaused
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isPaused ? '▶ Resume' : '▶ Start'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
