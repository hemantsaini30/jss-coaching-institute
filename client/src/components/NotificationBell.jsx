import { useState } from 'react'
import { Bell } from 'lucide-react'
import useNotificationStore from '../store/notificationStore'
import { timeAgo } from '../utils/helpers'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markRead } = useNotificationStore()

  const handleOpen = () => { setOpen(!open); if (!open) markRead() }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800">Notifications</span>
              <span className="text-xs text-gray-400">{notifications.length} total</span>
            </div>
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.slice(0, 5).map((n, i) => (
                  <li key={i} className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}