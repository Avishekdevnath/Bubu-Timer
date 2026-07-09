import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Megaphone, Send, Trash2 } from 'lucide-react'

function fullTime(ts) {
  const ms = ts?.toMillis ? ts.toMillis() : ts || 0
  if (!ms) return ''
  return new Date(ms).toLocaleString()
}

export function NotificationDetailPage({ notifData }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notifs, markRead, remove } = notifData
  const n = notifs.find((x) => x.id === id)

  useEffect(() => {
    if (n) markRead(n.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!n) {
    return (
      <div className="w-full px-4 md:px-6 pt-6">
        <button onClick={() => navigate('/notifications')} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-4">
          <ArrowLeft size={16} /> Back to notifications
        </button>
        <p className="text-sm text-stone-400">Notification not found — it may have been deleted.</p>
      </div>
    )
  }

  const Icon = n.type === 'announcement' ? Megaphone : Send
  const hasLink = n.url && n.url !== '/home'

  return (
    <div className="w-full px-4 md:px-6 pt-6">
      <button onClick={() => navigate('/notifications')} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-4">
        <ArrowLeft size={16} /> Back to notifications
      </button>

      <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-stone-400 capitalize">{n.type}</p>
            <p className="text-xs text-stone-300">{fullTime(n.createdAt)}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-stone-800 mb-2">{n.title}</h2>
        <p className="text-sm text-stone-600 whitespace-pre-wrap">{n.body}</p>

        <div className="flex gap-2 mt-6">
          {hasLink && (
            <button onClick={() => navigate(n.url)}
              className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
              <ExternalLink size={14} /> Open
            </button>
          )}
          <button onClick={() => { remove(n.id); navigate('/notifications') }}
            className={`${hasLink ? '' : 'flex-1'} py-2.5 px-4 border border-red-200 text-red-500 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-red-50`}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}
