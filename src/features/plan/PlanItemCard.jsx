import { useState } from 'react'
import { liveElapsedSec, itemRemainingSec } from './planModel.js'
import { formatRemaining, formatStudyMinutes } from '../../lib/format.js'
import { DurationControl } from './DurationControl.jsx'
import { DescEditor } from './DescEditor.jsx'

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

export function PlanItemCard({ item, now, onStart, onPause, onDone, onEdit, onReduce, readOnly, onRemove, activeItemId }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [editMinutes, setEditMinutes] = useState(Math.round((item.targetSec || 1800) / 60))
  const [editDesc, setEditDesc]       = useState(item.desc || '')

  const elapsed   = liveElapsedSec(item, now)
  const remaining = itemRemainingSec(item, now)
  const pct       = Math.min(100, item.targetSec ? (elapsed / item.targetSec) * 100 : 0)
  const over      = remaining < 0
  const isDone    = item.status === 'done'
  const isRunning = item.status === 'running'
  const isPaused  = item.status === 'paused'
  const otherRunning = !!(activeItemId && activeItemId !== item.id)
  const canEdit   = !readOnly && !isRunning && !isDone && !!onEdit
  const st        = STATUS[item.status] || STATUS.idle

  function openEdit(e) {
    e.stopPropagation()
    setEditMinutes(Math.round((item.targetSec || 1800) / 60))
    setEditDesc(item.desc || '')
    setEditing(true)
    setExpanded(false)
  }

  function saveEdit() {
    onEdit({ id: item.id, targetSec: editMinutes * 60, desc: editDesc })
    setEditing(false)
  }

  // ── Edit form ─────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="w-full bg-white border border-stone-200 rounded-2xl shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{item.subjectName}</p>
        <DescEditor
          value={editDesc}
          onChange={setEditDesc}
          placeholder="What to study (e.g. Ch.15 p.396-435)"
        />
        <DurationControl
          label="Time"
          value={editMinutes}
          min={5} max={720} step={5}
          chips={[15, 30, 45, 60, 90, 120, 180]}
          onCommit={setEditMinutes}
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-xs font-semibold"
          >Cancel</button>
          <button
            onClick={saveEdit}
            className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold"
          >Save</button>
        </div>
      </div>
    )
  }

  // ── Normal card ───────────────────────────────────────────────────────────
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
            {canEdit && (
              <button
                onClick={openEdit}
                className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 px-1"
              >Edit</button>
            )}
            {!readOnly && !isRunning && onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-red-400"
              >✕</button>
            )}
          </div>
        </div>

        {/* Collapsed: first desc line + log hint */}
        {!expanded && (
          <>
            {item.desc ? (
              <p className="text-xs text-stone-400 truncate mb-1.5">{item.desc.split('\n')[0].replace(/^• /, '')}</p>
            ) : null}
            {item.logs?.length > 0 && (
              <p className="text-[11px] text-stone-300 mb-1.5">
                {item.logs.length} session log{item.logs.length > 1 ? 's' : ''} · tap to view
              </p>
            )}
          </>
        )}

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

      {/* Expanded: full description + all logs */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-stone-50 pt-3">
          {item.desc ? (
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Target</p>
              <DescLines desc={item.desc} />
            </div>
          ) : null}
          {item.logs?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Progress Log</p>
              <div className="space-y-1.5">
                {item.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] text-stone-300 mt-0.5 flex-shrink-0">#{i + 1}</span>
                    <p className="text-xs text-stone-500 leading-snug">{log.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!item.desc && !item.logs?.length && (
            <p className="text-xs text-stone-300 text-center py-1">No details added.</p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!readOnly && !isDone && (
        <div className="px-4 pb-3 pt-1 flex gap-2">
          {isRunning ? (
            <>
              {onReduce && (
                <button onClick={onReduce} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50">
                  ↓ Reduce
                </button>
              )}
              <button onClick={onPause} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold">
                Pause &amp; Log
              </button>
              <button onClick={onDone} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold">
                Mark Done
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              disabled={otherRunning}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                otherRunning ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : isPaused ? 'bg-amber-500 text-white'
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
