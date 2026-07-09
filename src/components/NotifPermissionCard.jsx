import { useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { registerPushToken } from '../lib/messaging.js'

const DISMISS_KEY = 'bubu_notifperm_dismissed'

export function NotifPermissionCard({ currentUser, showToast }) {
  const [perm, setPerm] = useState(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission))
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')

  if (dismissed || perm === 'granted' || perm === 'unsupported') return null
  if (!currentUser || currentUser.isGuest) return null
  if (window.Capacitor?.isNativePlatform?.()) return null

  async function enable() {
    const token = await registerPushToken(currentUser.uid)
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
    showToast?.(token ? 'Notifications enabled' : 'Could not enable notifications')
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
        <BellRing size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">Turn on notifications</p>
        {perm === 'denied' ? (
          <p className="text-xs text-amber-700 mt-0.5">
            Notifications are blocked. Open your browser&apos;s site settings (lock icon in the address bar) and allow notifications for this site.
          </p>
        ) : (
          <>
            <p className="text-xs text-amber-700 mt-0.5">Get chat replies and timer alerts even when the app is closed.</p>
            <button onClick={enable}
              className="mt-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors">
              Enable notifications
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} className="shrink-0 p-1 rounded hover:bg-amber-100 text-amber-500" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
