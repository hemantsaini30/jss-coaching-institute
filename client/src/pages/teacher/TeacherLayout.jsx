import { Routes, Route, Navigate } from 'react-router-dom'
import { Home, Users, Upload, ClipboardList, BarChart2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import TeacherHome       from './TeacherHome'
import TeacherAttendance from './TeacherAttendance'
import TeacherContent    from './TeacherContent'
import TeacherMCQ        from './TeacherMCQ'
import TeacherAnalytics  from './TeacherAnalytics'
import { useSocket }     from '../../hooks/useSocket'
import { useQuery }      from '@tanstack/react-query'
import api               from '../../utils/api'
import useNotificationStore from '../../store/notificationStore'
import { useEffect }     from 'react'

const navItems = [
  { to: '/teacher/home',       icon: Home,          label: 'Home'       },
  { to: '/teacher/attendance', icon: Users,         label: 'Attendance' },
  { to: '/teacher/content',    icon: Upload,        label: 'Content'    },
  { to: '/teacher/mcq',        icon: ClipboardList, label: 'MCQ'        },
  { to: '/teacher/analytics',  icon: BarChart2,     label: 'Analytics'  },
]

export default function TeacherLayout() {
  useSocket()
  const setNotifications = useNotificationStore(s => s.setNotifications)

  const { data: classes = [] } = useQuery({
    queryKey: ['teacherClasses'],
    queryFn:  () => api.get('/teacher/classes').then(r => r.data),
  })

  return (
    <DashboardLayout navItems={navItems} role="teacher" title="Teacher Portal">
      <Routes>
        <Route path="home"       element={<TeacherHome       classes={classes} />} />
        <Route path="attendance" element={<TeacherAttendance classes={classes} />} />
        <Route path="content"    element={<TeacherContent    classes={classes} />} />
        <Route path="mcq"        element={<TeacherMCQ        classes={classes} />} />
        <Route path="analytics"  element={<TeacherAnalytics  classes={classes} />} />
        <Route path="*"          element={<Navigate to="home" replace />} />
      </Routes>
    </DashboardLayout>
  )
}