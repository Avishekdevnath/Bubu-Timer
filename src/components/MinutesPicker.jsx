import { useState } from 'react'

function fmtHM(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function MinutesPicker({ elapsedMin, onSubmit, onCancel }) {
  const [reduceMin, setReduceMin] = useState(5)
  const maxReduce = Math.max(1, elapsedMin)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-stone-800 mb-3">Reduce Progress Time</h3>
        <p className="text-xs text-stone-500 mb-3">Current elapsed: {fmtHM(elapsedMin)} · Select time to remove</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>0m</span>
            <span className="text-base font-bold text-stone-800 tabular-nums">{fmtHM(reduceMin)} to reduce</span>
            <span>{fmtHM(maxReduce)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxReduce}
            step={1}
            value={reduceMin}
            onChange={(e) => setReduceMin(Number(e.target.value))}
            className="w-full accent-stone-800"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50">Cancel</button>
          <button onClick={() => onSubmit(reduceMin * 60)} className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold">Reduce</button>
        </div>
      </div>
    </div>
  )
}