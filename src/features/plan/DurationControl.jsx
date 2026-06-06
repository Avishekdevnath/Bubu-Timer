import { useState } from 'react'

function toHM(totalMin) {
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 }
}

function clampTotal(total, min, max) {
  return Math.max(min, Math.min(max, total))
}

function chipLabel(c) {
  if (c < 60) return `${c}m`
  if (c % 60 === 0) return `${c / 60}h`
  return `${Math.floor(c / 60)}h${c % 60}m`
}

const DEFAULT_CHIPS = [15, 30, 45, 60, 90, 120, 180]

export function DurationControl({ label, value, min = 5, max = 720, step = 5, chips = DEFAULT_CHIPS, onCommit }) {
  const { h, m } = toHM(value)
  const [hDraft, setHDraft] = useState(String(h))
  const [mDraft, setMDraft] = useState(String(m))

  function commitHM(newH, newM) {
    const total = clampTotal(newH * 60 + newM, min, max)
    const { h: ch, m: cm } = toHM(total)
    setHDraft(String(ch))
    setMDraft(String(cm))
    if (total !== value) onCommit(total)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-stone-700 mr-auto">{label}</span>

        {/* Hours stepper */}
        <div className="flex items-center gap-1">
          <button onClick={() => commitHM(Math.max(0, h - 1), m)}
            className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">−</button>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" value={hDraft}
            onChange={(e) => setHDraft(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={(e) => {
              const n = parseInt(e.target.value, 10)
              commitHM(Number.isFinite(n) ? Math.max(0, n) : h, m)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
            className="w-9 text-center text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg py-1 focus:border-stone-400 focus:outline-none"
          />
          <span className="text-xs text-stone-400">h</span>
          <button onClick={() => commitHM(h + 1, m)}
            className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">+</button>
        </div>

        <span className="text-stone-300 text-xs">|</span>

        {/* Minutes stepper */}
        <div className="flex items-center gap-1">
          <button onClick={() => commitHM(h, Math.max(0, m - step))}
            className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">−</button>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" value={mDraft}
            onChange={(e) => setMDraft(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={(e) => {
              const n = parseInt(e.target.value, 10)
              commitHM(h, Number.isFinite(n) ? Math.max(0, Math.min(55, n)) : m)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
            className="w-9 text-center text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg py-1 focus:border-stone-400 focus:outline-none"
          />
          <span className="text-xs text-stone-400">m</span>
          <button onClick={() => commitHM(h, Math.min(55, m + step))}
            className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">+</button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => {
          const { h: ch, m: cm } = toHM(c)
          return (
            <button key={c} onClick={() => commitHM(ch, cm)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${value === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'}`}>
              {chipLabel(c)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
