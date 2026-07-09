import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Megaphone, Send, Trash2, X } from 'lucide-react'
import { AppModal } from '../components/AppModal.jsx'

function relTime(ts) {
  const ms = ts?.toMillis ? ts.toMillis() : ts || 0
  if (!ms) return ''
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  return new Date(ms).toLocaleDateString()
}

export function NotificationsPage({ notifData }) {
  const navigate = useNavigate()
  const { visible, notifState, markRead, markAllRead, remove, clearAll } = notifData
  const [confirmClear, setConfirmClear] = useState(false)
  const read = notifState?.read || {}

  function open(n) {
    markRead(n.id)
    navigate(n.url || '/home')
  }

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-stone-800">Notifications</h2>
          <p className="text-sm text-stone-500 mt-0.5">{visible.length} total</p>
        </div>
        {visible.length > 0 && (
          <div className="flex gap-2">
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-50">
              <CheckCheck size={12} /> Read all
            </button>
            <button onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 bg-white border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50">
              <Trash2 size={12} /> Clear
            </button>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-stone-300">
          <Bell size={36} strokeWidth={1.2} />
          <p className="text-sm text-stone-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const unread = !read[n.id]
            const Icon = n.type === 'announcement' ? Megaphone : Send
            return (
              <div key={n.id}
                className={`bg-white border rounded-2xl shadow-sm p-4 flex items-start gap-3 cursor-pointer hover:bg-stone-50 transition-colors ${unread ? 'border-l-4 border-l-amber-400 border-stone-100' : 'border-stone-100'}`}
                onClick={() => open(n)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${unread ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${unread ? 'font-semibold text-stone-800' : 'font-medium text-stone-600'}`}>{n.title}</p>
                  <p className="text-xs text-stone-400 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-stone-300 mt-1">{relTime(n.createdAt)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                  className="p-1.5 rounded-full text-stone-300 hover:text-stone-500 hover:bg-stone-100 shrink-0" aria-label="Delete">
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {confirmClear && (
        <AppModal title="Clear all notifications?" onClose={() => setConfirmClear(false)}>
          <p className="text-sm text-stone-500 mb-3">Removes every notification from your inbox. Cannot be undone.</p>
          <button onClick={() => { clearAll(); setConfirmClear(false) }}
            className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl">
            Clear all
          </button>
        </AppModal>
      )}
    </div>
  )
}
