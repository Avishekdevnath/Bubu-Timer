import { ChevronLeft, Pin } from 'lucide-react'
import { MAX_PINS } from '../features/partner/partnerApi.js'

export function PinnedPage({ room, navigate }) {
  const { pair, chatMessages, setJumpToId, togglePin } = room
  const pins = pair?.pins || {}
  const pinIds = Object.keys(pins)
  const pinned = chatMessages
    .filter((m) => pinIds.includes(m.id))
    .sort((a, b) => (pins[b.id]?.ts || 0) - (pins[a.id]?.ts || 0))

  function jump(id) {
    setJumpToId(id)
    navigate('/buddy')
  }

  return (
    <div className="w-full px-4 md:px-6 pt-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/buddy')} className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-light tracking-tight text-stone-800 flex items-center gap-2">
              <Pin size={20} className="text-stone-600 fill-stone-600" /> Pinned
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">{pinned.length} of max {MAX_PINS}</p>
          </div>
        </div>
      </div>

      {pinned.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <Pin size={32} strokeWidth={1} className="mb-3" />
          <p className="text-sm font-medium">No pinned messages yet</p>
          <p className="text-xs text-stone-300 mt-1">Tap a message → Pin to add</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {pinned.map((msg) => {
            const isMe = msg.sender === pair.mySlot
            const senderName = isMe ? 'Me' : (pair.partnerNick || pair.data?.name || 'Partner')
            return (
              <div key={msg.id}
                onClick={() => jump(msg.id)}
                className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 cursor-pointer hover:border-stone-300 hover:shadow-md transition-all group">
                <div className="flex justify-between items-center text-xs text-stone-500 mb-1.5">
                  <span className="font-semibold text-stone-700">{senderName}</span>
                  <span>{msg.ts ? new Date(msg.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                </div>
                <p className="text-sm text-stone-800 line-clamp-3 break-words" style={{ overflowWrap: 'anywhere' }}>{msg.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-stone-400 group-hover:text-stone-600 font-medium transition-colors">Tap to view in chat →</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(msg.id) }}
                    className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors">
                    UNPIN
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
