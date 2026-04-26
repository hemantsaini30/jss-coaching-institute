import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

import LandingPage  from './pages/public/LandingPage'
import LoginPage    from './pages/public/LoginPage'

// Lazy placeholders for v4/v5/v6 — swap with real imports later
import { lazy, Suspense } from 'react'
import LoadingSpinner from './components/LoadingSpinner'

const StudentLayout = lazy(() => import('./pages/student/StudentLayout'))
const TeacherLayout = lazy(() => import('./pages/teacher/TeacherLayout'))
const AdminLayout   = lazy(() => import('./pages/admin/AdminLayout'))

function RequireAuth({ children, roles }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading..." />}>
      <Routes>
        <Route path="/"      element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/student/*" element={
          <RequireAuth roles={['student']}>
            <StudentLayout />
          </RequireAuth>
        } />
        <Route path="/teacher/*" element={
          <RequireAuth roles={['teacher']}>
            <TeacherLayout />
          </RequireAuth>
        } />
        <Route path="/admin/*" element={
          <RequireAuth roles={['admin']}>
            <AdminLayout />
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}