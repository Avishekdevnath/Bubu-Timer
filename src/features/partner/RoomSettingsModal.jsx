import { useState } from 'react'

export function RoomSettingsModal({ pair, d, onClose, onCopy, onShare, onKick, onLeave, onSaveNick, onOpenPins, onOpenStarred, onOpenChecklists, onOpenReport }) {
  const [nick, setNick] = useState(pair.partnerNick || '')
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-800">Room Settings</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4 border-b border-stone-50">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Room Code</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-mono font-bold tracking-[0.2em] text-stone-800 flex-1">{pair.roomCode}</p>
            <button onClick={onCopy} className="px-3 py-1.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors">Copy</button>
            <button onClick={onShare} className="px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-200 transition-colors">Share</button>
          </div>
        </div>
        {d && (
          <div className="px-5 py-4 border-b border-stone-50">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Partner Nickname</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder={d.name || 'Enter nickname…'}
                maxLength={20}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-400"
              />
              <button
                onClick={() => onSaveNick(nick)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors">
                Save
              </button>
            </div>
            <p className="text-[10px] text-stone-400 mt-1.5">Only visible to you</p>
          </div>
        )}
        <div className="px-5 py-3 space-y-1">
          <button onClick={onOpenChecklists} className="w-full py-3 text-sm font-semibold text-stone-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">
            ✅ Shared Checklists
          </button>
          {d && (
            <button onClick={onOpenReport} className="w-full py-3 text-sm font-semibold text-stone-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
              📊 Partner Report
            </button>
          )}
          <button onClick={onOpenPins} className="w-full py-3 text-sm font-semibold text-stone-700 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors flex items-center justify-center gap-2">
            📌 Pinned Messages
          </button>
          <button onClick={onOpenStarred} className="w-full py-3 text-sm font-semibold text-yellow-700 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2">
            ⭐ My Starred
          </button>
          {pair.mySlot === 'A' && d && (
            <button onClick={onKick} className="w-full py-3 text-sm font-semibold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              Remove Partner
            </button>
          )}
          <button onClick={onLeave} className="w-full py-3 text-sm font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            Leave Room
          </button>
        </div>
        <div className="h-3" />
      </div>
    </div>
  )
}
