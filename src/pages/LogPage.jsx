import { ClipboardList, Trash2 } from 'lucide-react'

export function LogPage({ appState, patchState }) {
  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-stone-800">Activity Log</h2>
          <p className="text-sm text-stone-500 mt-0.5">Your recent study history</p>
        </div>
        <button onClick={() => patchState({ logs: [] })}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 bg-white border border-stone-200 px-3 py-2 rounded-full hover:bg-stone-50 transition-colors">
          <Trash2 size={13} /> Clear
        </button>
      </div>
      {!appState.logs.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <ClipboardList size={36} strokeWidth={1} className="mb-3" />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="relative pl-4 border-l border-stone-200 space-y-3">
          {appState.logs.map((log, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full bg-stone-300 border-2 border-[#FDFCF9]" />
              <div className="bg-white p-3 px-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                <span className="text-sm font-medium text-stone-700">{log.msg}</span>
                <span className="text-xs text-stone-400 font-medium ml-3 shrink-0">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
