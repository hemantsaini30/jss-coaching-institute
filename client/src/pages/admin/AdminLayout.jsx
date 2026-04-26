import { Routes, Route, Navigate } from 'react-router-dom'
import { Home, MessageSquare, Users, Bell, Activity } from 'lucide-react'
import DashboardLayout  from '../../components/DashboardLayout'
import AdminHome          from './AdminHome'
import AdminInquiries     from './AdminInquiries'
import AdminUsers         from './AdminUsers'
import AdminNotifications from './AdminNotifications'
import AdminLogs          from './AdminLogs'
import { useSocket }      from '../../hooks/useSocket'
import { useQuery }       from '@tanstack/react-query'
import api                from '../../utils/api'
import useNotificationStore from '../../store/notificationStore'
import { useEffect }      from 'react'

const navItems = [
  { to: '/admin/home',          icon: Home,          label: 'Overview'      },
  { to: '/admin/inquiries',     icon: MessageSquare, label: 'Inquiries'     },
  { to: '/admin/users',         icon: Users,         label: 'Users'         },
  { to: '/admin/notifications', icon: Bell,          label: 'Notifications' },
  { to: '/admin/logs',          icon: Activity,      label: 'Logs'          },
]

export default function AdminLayout() {
  useSocket()
  const setNotifications = useNotificationStore(s => s.setNotifications)

  const { data: notifs = [] } = useQuery({
    queryKey: ['adminNotifs'],
    queryFn:  () => api.get('/admin/notifications').then(r => r.data).catch(() => []),
  })
  useEffect(() => { if (notifs.length) setNotifications(notifs) }, [notifs, setNotifications])

  return (
    <DashboardLayout navItems={navItems} role="admin" title="Admin Panel">
      <Routes>
        <Route path="home"          element={<AdminHome />}          />
        <Route path="inquiries"     element={<AdminInquiries />}     />
        <Route path="users"         element={<AdminUsers />}         />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="logs"          element={<AdminLogs />}          />
        <Route path="*"             element={<Navigate to="home" replace />} />
      </Routes>
    </DashboardLayout>
  )
}