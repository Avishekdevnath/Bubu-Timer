import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { DoorClosed, Eraser } from 'lucide-react'
import { database } from '../../lib/firebase.js'
import { AppModal } from '../../components/AppModal.jsx'
import { closeRoom, clearChat } from './adminApi.js'

export function AdminRoomsTab({ showToast }) {
  const [rooms, setRooms] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'close'|'clear', code }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = onValue(ref(database, 'rooms'),
      (snap) => setRooms(snap.val() || {}),
      (err) => showToast(`Rooms load failed: ${err.message}`))
    return unsub
  }, [showToast])

  async function runConfirm() {
    const { kind, code } = confirm
    setBusy(true)
    try {
      if (kind === 'close') await closeRoom(code)
      else await clearChat(code)
      showToast(kind === 'close' ? `Room ${code} closed` : `Chat cleared in ${code}`)
      setConfirm(null)
    } catch (err) {
      showToast(`Failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const entries = Object.entries(rooms || {})
  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-400 mb-1">{rooms === null ? 'Loading…' : `${entries.length} rooms`}</p>
      {entries.map(([code, room]) => {
        const members = ['A', 'B'].map((s) => room?.[s]?.name || room?.[s]?.uid).filter(Boolean)
        const msgCount = Object.keys(room?.chat || {}).length
        return (
          <div key={code} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800">{code}</p>
              <p className="text-xs text-stone-400 truncate">{members.join(' + ') || 'empty'} · {msgCount} messages</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setConfirm({ kind: 'clear', code })}
                className="p-2 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50" title="Clear chat">
                <Eraser size={14} />
              </button>
              <button onClick={() => setConfirm({ kind: 'close', code })}
                className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50" title="Close room">
                <DoorClosed size={14} />
              </button>
            </div>
          </div>
        )
      })}
      {confirm && (
        <AppModal title={confirm.kind === 'close' ? `Close room ${confirm.code}?` : `Clear chat in ${confirm.code}?`} onClose={() => setConfirm(null)}>
          <p className="text-sm text-stone-500 mb-3">
            {confirm.kind === 'close'
              ? 'Deletes the whole room: members, chat, pins, checklists. Both partners get disconnected. Cannot be undone.'
              : 'Deletes every chat message in this room. Members and settings survive. Cannot be undone.'}
          </p>
          <button onClick={runConfirm} disabled={busy}
            className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            {confirm.kind === 'close' ? 'Close room' : 'Clear chat'}
          </button>
        </AppModal>
      )}
    </div>
  )
}
