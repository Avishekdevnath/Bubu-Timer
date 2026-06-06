import { fromPlanPayload } from '../plan/planSync.js'

export function PartnerCard({ data, partnerNick }) {
  const displayName = partnerNick || data?.name || 'Partner'
  const online = !!data?.online
  const plan = fromPlanPayload(data?.plan)
  const active = plan?.items?.find((i) => i.id === plan?.activeItemId)
  const doneCount = plan?.items?.filter((i) => i.status === 'done').length ?? 0
  const totalCount = plan?.items?.length ?? 0

  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-5 border-b border-stone-50">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-xl font-semibold text-stone-600 shrink-0">
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 text-base truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-stone-300'}`} />
            <span className="text-xs text-stone-400">{online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-stone-400 font-semibold">{doneCount}/{totalCount} done</span>
        )}
      </div>
      <div className="px-5 py-3">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Now studying</p>
        {active ? (
          <p className="text-sm font-medium text-stone-700">{active.subjectName}</p>
        ) : (
          <p className="text-sm text-stone-400">{plan ? 'Between subjects' : 'No plan today'}</p>
        )}
        {active?.desc ? <p className="text-xs text-stone-400 mt-0.5">{active.desc}</p> : null}
      </div>
    </div>
  )
}
