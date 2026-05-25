import { daysLeft } from '../lib/dates.js'

export function GoalBar({ state, progress, onOpen }) {
  if (!state.activeTarget) {
    return (
      <button onClick={onOpen} type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-dashed border-stone-200 rounded-xl text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-colors shadow-sm">
        <span>Set today's goal</span>
        <span className="text-lg font-light">+</span>
      </button>
    )
  }

  const isRange = state.activeTarget.type === 'range'
  return (
    <button onClick={onOpen} type="button" className="w-full text-left">
      <div className={`px-4 py-3 rounded-xl border shadow-sm transition-colors ${progress.done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-stone-600">
            {isRange ? 'Range goal' : 'Today'}: {progress.label} / {progress.goalLabel}
            {isRange ? <span className="ml-1.5 text-stone-400 font-normal">· {daysLeft(state.activeTarget.endDate)} days left</span> : null}
          </span>
          <span className="text-xs font-bold text-stone-800">{progress.pct}%</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress.pct}%`, background: progress.done ? '#10b981' : '#1c1917' }} />
        </div>
      </div>
    </button>
  )
}
