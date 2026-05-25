import { AppModal } from '../../components/AppModal.jsx'
import { formatStudyMinutes } from '../../lib/format.js'

export function ReportModal({ summary, onClose }) {
  const total = formatStudyMinutes(summary.totalMin)
  return (
    <AppModal title="Daily Report" onClose={onClose}>
      <div className="text-center py-6 bg-stone-50 rounded-xl mb-4">
        <p className="text-4xl font-bold text-stone-800">{total}</p>
        <p className="text-sm text-stone-500 mt-1">{summary.totalSessions} sessions</p>
      </div>
      {summary.target ? (
        <div className="flex justify-between items-center px-1 mb-3 text-sm">
          <span className="text-stone-500">Goal</span>
          <span className="font-medium text-stone-800">{summary.achievedLabel} / {summary.goalLabel} {summary.achieved ? '✓' : '✗'}</span>
        </div>
      ) : null}
      <div className="space-y-2 mb-4">
        {Object.values(summary.subjectsBreakdown).map((s) => (
          <div key={s.name} className="flex justify-between items-center px-1 text-sm">
            <span className="text-stone-700 font-medium truncate">{s.name}</span>
            <span className="text-stone-400 ml-2 shrink-0">{s.sessions} sessions · {s.minutes}m</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">Got it</button>
    </AppModal>
  )
}
