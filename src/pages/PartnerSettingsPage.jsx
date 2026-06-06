import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function PartnerSettingsPage({ room, showToast }) {
  const navigate = useNavigate()
  const { pair, saveNickname, kickPartner, disconnect } = room
  const [nick, setNick] = useState(pair.partnerNick || '')
  const d = pair.data

  function copyCode() {
    navigator.clipboard.writeText(pair.roomCode || '').catch(() => {})
    showToast('Room code copied', 'study-t')
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: 'Join my study room', text: `Room code: ${pair.roomCode}` }).catch(() => {})
    } else {
      copyCode()
    }
  }

  if (!pair.connected) {
    return (
      <div className="w-full px-4 md:px-6 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 mb-6 hover:text-stone-700 transition-colors">
          <ChevronLeft size={18} /> Back
        </button>
        <p className="text-stone-400 text-center py-16">Not connected to a partner room.</p>
        <button onClick={() => navigate('/buddy')}
          className="w-full py-3 bg-stone-900 text-white rounded-xl text-sm font-semibold">
          Go to Chat to join a room
        </button>
      </div>
    )
  }

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-stone-400 mb-6 hover:text-stone-700 transition-colors">
        <ChevronLeft size={18} /> Back
      </button>
      <h2 className="text-2xl font-light tracking-tight text-stone-800 mb-6">Partner Settings</h2>

      <div className="space-y-4">
        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Room Code</p>
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
            <p className="text-4xl font-mono font-bold tracking-[0.2em] text-stone-800 mb-3">{pair.roomCode}</p>
            <div className="flex gap-2">
              <button onClick={copyCode}
                className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">
                Copy
              </button>
              <button onClick={share}
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-200 transition-colors">
                Share
              </button>
            </div>
          </div>
        </section>

        {d && (
          <section>
            <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Partner Nickname</p>
            <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
              <div className="flex gap-2">
                <input type="text" value={nick} onChange={(e) => setNick(e.target.value)}
                  placeholder={d.name || 'Enter nickname…'} maxLength={20}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <button onClick={() => saveNickname(nick)}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors">
                  Save
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-1.5">Only visible to you</p>
            </div>
          </section>
        )}

        <section>
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">Danger Zone</p>
          <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
            {pair.mySlot === 'A' && d && (
              <button onClick={kickPartner}
                className="w-full py-4 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors border-b border-red-50">
                Remove Partner from Room
              </button>
            )}
            <button onClick={() => { disconnect(); navigate('/buddy') }}
              className="w-full py-4 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
              Leave Room
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
