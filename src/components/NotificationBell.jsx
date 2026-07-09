import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NotificationBell({ unread }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/notifications')}
      className="relative p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-500"
      title="Notifications" aria-label="Notifications">
      <Bell size={16} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}
