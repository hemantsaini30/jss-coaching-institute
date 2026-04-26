import { Routes, Route, Navigate } from 'react-router-dom'
import { Home, PlayCircle, ClipboardList, BarChart2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import StudentHome        from './StudentHome'
import StudentContent     from './StudentContent'
import StudentTest        from './StudentTest'
import StudentPerformance from './StudentPerformance'
import { useSocket } from '../../hooks/useSocket'
import { useQuery } from '@tanstack/react-query'
import api from '../../utils/api'
import useNotificationStore from '../../store/notificationStore'
import useAuthStore from '../../store/authStore'
import { useEffect } from 'react'

const navItems = [
  { to: '/student/home',        icon: Home,          label: 'Home'        },
  { to: '/student/content',     icon: PlayCircle,    label: 'Content'     },
  { to: '/student/test',        icon: ClipboardList, label: 'Tests'       },
  { to: '/student/performance', icon: BarChart2,     label: 'Performance' },
]

export default function StudentLayout() {
  useSocket()
  const user = useAuthStore(s => s.user)
  const setNotifications = useNotificationStore(s => s.setNotifications)

  // Preload notifications
  const { data } = useQuery({
    queryKey: ['notifications', user?.classID],
    queryFn:  () => api.get(`/student/notifications/${user.classID}`).then(r => r.data),
    enabled:  !!user?.classID,
  })
  useEffect(() => { if (data) setNotifications(data) }, [data, setNotifications])

  return (
    <DashboardLayout navItems={navItems} role="student" title="Student Portal">
      <Routes>
        <Route path="home"        element={<StudentHome />} />
        <Route path="content"     element={<StudentContent />} />
        <Route path="test"        element={<StudentTest />} />
        <Route path="performance" element={<StudentPerformance />} />
        <Route path="*"           element={<Navigate to="home" replace />} />
      </Routes>
    </DashboardLayout>
  )
}