import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { Megaphone, X } from 'lucide-react'
import { firestore } from '../lib/firebase.js'
import { ANN_DISMISS_KEY, shouldShowAnnouncement } from '../features/admin/announcement.js'

export function AnnouncementBanner() {
  const [ann, setAnn] = useState(null)
  const [dismissedAt, setDismissedAt] = useState(() => Number(localStorage.getItem(ANN_DISMISS_KEY)) || 0)

  useEffect(() => {
    return onSnapshot(doc(firestore, 'config', 'announcement'),
      (snap) => setAnn(snap.exists() ? snap.data() : null),
      () => {}) // silent — banner is best-effort
  }, [])

  if (!shouldShowAnnouncement(ann, dismissedAt)) return null

  function dismiss() {
    localStorage.setItem(ANN_DISMISS_KEY, String(ann.updatedAt))
    setDismissedAt(ann.updatedAt)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
      <Megaphone size={14} className="shrink-0" />
      <p className="flex-1 min-w-0">{ann.text}</p>
      <button onClick={dismiss} className="shrink-0 p-1 rounded hover:bg-amber-100" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
