import { useState } from 'react'

function fmtHM(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function AwayModal({ awayMin, itemName, onConfirm, onKeepAll }) {
  const [studiedMin, setStudiedMin] = useState(awayMin)
  const trimMin = awayMin - studiedMin

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4 md:items-center">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-in slide-in-from-bottom-4 duration-200">
        <div>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">Timer ran while away</p>
          <p className="text-sm text-stone-700 leading-snug">
            Screen was off for <span className="font-bold">{fmtHM(awayMin)}</span> while{' '}
            <span className="font-semibold">{itemName || 'timer'}</span> was running.
          </p>
          <p className="text-xs text-stone-400 mt-1">How long were you actually studying?</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>0m</span>
            <span className="text-base font-bold text-stone-800 tabular-nums">{fmtHM(studiedMin)}</span>
            <span>{fmtHM(awayMin)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={awayMin}
            step={1}
            value={studiedMin}
            onChange={(e) => setStudiedMin(Number(e.target.value))}
            className="w-full accent-stone-800"
          />
          <p className="text-xs text-center h-4 text-stone-400">
            {trimMin > 0
              ? <span>Trims <span className="text-red-500 font-semibold">{fmtHM(trimMin)}</span> from elapsed time</span>
              : <span className="text-stone-300">No time will be trimmed</span>}
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onKeepAll}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-semibold"
          >
            Keep All
          </button>
          <button
            onClick={() => onConfirm(studiedMin)}
            className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
