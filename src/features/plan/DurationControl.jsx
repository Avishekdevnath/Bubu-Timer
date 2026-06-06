import { useState } from 'react'

export function DurationControl({ label, value, min, max, step, chips, onCommit }) {
  const [draft, setDraft] = useState(String(value))
  const clamp = (n) => Math.max(min, Math.min(max, n))
  const commit = (raw) => {
    const n = parseInt(raw, 10)
    const next = Number.isFinite(n) ? clamp(n) : value
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }
  return (
    <div className="p-4 border-b border-stone-50 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => commit(value - step)} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">−</button>
          <div className="flex items-center gap-1">
            <input type="text" inputMode="numeric" pattern="[0-9]*" value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
              className="w-12 text-center text-sm font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg py-1 focus:border-stone-400 focus:outline-none" />
            <span className="text-xs text-stone-400">min</span>
          </div>
          <button onClick={() => commit(value + step)} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-50">+</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {chips.map((c) => (
          <button key={c} onClick={() => commit(c)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${value === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'}`}>{c}</button>
        ))}
      </div>
    </div>
  )
}
