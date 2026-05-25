import { formatStudyMinutes } from '../../lib/format.js'

const MODE_CONFIG = {
  study: { label: 'Studying', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  break: { label: 'On Break', color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  idle:  { label: 'Idle',     color: 'bg-stone-300',  text: 'text-stone-500',  bg: 'bg-stone-50 border-stone-200' },
}

export function PartnerCard({ data, partnerNick }) {
  const mode = data.online ? (data.mode || 'idle') : 'idle'
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.idle
  const displayName = partnerNick || data.name || 'Partner'

  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-stone-50">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-xl font-semibold text-stone-600 shrink-0">
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 text-base truncate">{displayName}</p>
          {partnerNick && data.name && <p className="text-[10px] text-stone-400 truncate">{data.name}</p>}
          <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.color} ${mode === 'study' ? 'animate-pulse' : ''}`} />
            {data.online ? cfg.label : 'Offline'}
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="px-5 py-3 border-b border-stone-50">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Currently Studying</p>
        <p className="text-sm font-medium text-stone-700">{data.chapter || 'No subject selected'}</p>
        {data.chapterPages ? <p className="text-xs text-stone-400 mt-0.5">Pages {data.chapterPages}</p> : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-stone-100">
        {[
          { label: 'Sessions', value: data.sessions || 0 },
          { label: 'Studied', value: formatStudyMinutes(data.studyMin || 0) },
          { label: 'Streak', value: `${data.streak || 0}d` },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center py-4">
            <span className="text-lg font-semibold text-stone-800">{s.value}</span>
            <span className="text-[9px] font-bold tracking-wider text-stone-400 uppercase mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
