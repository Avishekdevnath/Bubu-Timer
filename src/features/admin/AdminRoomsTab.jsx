import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { ChevronDown, ChevronUp, DoorClosed, Eraser, Search, UserX } from 'lucide-react'
import { database } from '../../lib/firebase.js'
import { AppModal } from '../../components/AppModal.jsx'
import { closeRoom, clearChat, kickMember } from './adminApi.js'
import { filterRooms, roomTimestamps } from './roomStats.js'

export function AdminRoomsTab({ showToast }) {
  const [rooms, setRooms] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'close'|'clear'|'kick', code, slot? }
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedCode, setExpandedCode] = useState(null)

  useEffect(() => {
    const unsub = onValue(ref(database, 'rooms'),
      (snap) => setRooms(snap.val() || {}),
      (err) => showToast(`Rooms load failed: ${err.message}`))
    return unsub
  }, [showToast])

  async function runConfirm() {
    const { kind, code, slot } = confirm
    setBusy(true)
    try {
      if (kind === 'close') await closeRoom(code)
      else if (kind === 'clear') await clearChat(code)
      else await kickMember(code, slot)
      showToast(kind === 'close' ? `Room ${code} closed` : kind === 'clear' ? `Chat cleared in ${code}` : `Kicked slot ${slot} from ${code}`)
      setConfirm(null)
    } catch (err) {
      showToast(`Failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const entries = filterRooms(rooms || {}, search)
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
          <input className="field-in pl-8" placeholder="Search by code or name"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="text-xs text-stone-400 shrink-0">{rooms === null ? 'Loading…' : `${entries.length} rooms`}</p>
      </div>
      {entries.map(([code, room]) => {
        const members = ['A', 'B'].map((s) => room?.[s]?.name || room?.[s]?.uid).filter(Boolean)
        const msgCount = Object.keys(room?.chat || {}).length
        const expanded = expandedCode === code
        const { created, lastActive } = roomTimestamps(room)
        const lastMessages = Object.values(room?.chat || {})
          .sort((a, b) => (a.ts || 0) - (b.ts || 0))
          .slice(-30)
        return (
          <div key={code} className="bg-white border border-stone-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setExpandedCode(expanded ? null : code)} className="min-w-0 text-left flex-1">
                <p className="text-sm font-semibold text-stone-800">{code}</p>
                <p className="text-xs text-stone-400 truncate">{members.join(' + ') || 'empty'} · {msgCount} messages</p>
              </button>
              <div className="flex gap-2 shrink-0 items-center">
                <button onClick={() => setConfirm({ kind: 'clear', code })}
                  className="p-2 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50" title="Clear chat">
                  <Eraser size={14} />
                </button>
                <button onClick={() => setConfirm({ kind: 'close', code })}
                  className="p-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50" title="Close room">
                  <DoorClosed size={14} />
                </button>
                {expanded ? <ChevronUp size={14} className="text-stone-300" /> : <ChevronDown size={14} className="text-stone-300" />}
              </div>
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                <p className="text-xs text-stone-400">
                  Created {created ? new Date(created).toLocaleString() : '—'} · Last active {lastActive ? new Date(lastActive).toLocaleString() : '—'}
                </p>
                <div className="flex gap-2">
                  {['A', 'B'].map((slot) => room?.[slot] && (
                    <button key={slot} onClick={() => setConfirm({ kind: 'kick', code, slot })}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50">
                      <UserX size={12} /> Kick {room[slot].name || slot}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1.5">Recent messages</p>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {lastMessages.length === 0 && <p className="text-xs text-stone-400">No messages yet</p>}
                    {lastMessages.map((m, i) => (
                      <p key={i} className="text-xs text-stone-600">
                        <span className="font-semibold">{m.senderName || m.sender}:</span> {m.text}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {confirm && (
        <AppModal title={
          confirm.kind === 'close' ? `Close room ${confirm.code}?`
            : confirm.kind === 'clear' ? `Clear chat in ${confirm.code}?`
            : `Kick slot ${confirm.slot} from ${confirm.code}?`
        } onClose={() => setConfirm(null)}>
          <p className="text-sm text-stone-500 mb-3">
            {confirm.kind === 'close' && 'Deletes the whole room: members, chat, pins, checklists. Both partners get disconnected. Cannot be undone.'}
            {confirm.kind === 'clear' && 'Deletes every chat message in this room. Members and settings survive. Cannot be undone.'}
            {confirm.kind === 'kick' && 'Removes this member from the room. Chat history and the other member stay. They can rejoin with the room code if it stays open.'}
          </p>
          <button onClick={runConfirm} disabled={busy}
            className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            {confirm.kind === 'close' ? 'Close room' : confirm.kind === 'clear' ? 'Clear chat' : 'Kick member'}
          </button>
        </AppModal>
      )}
    </div>
  )
}
