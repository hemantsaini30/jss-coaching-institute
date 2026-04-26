import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [userID,   setUserID]   = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(userID.trim(), password.trim())
      toast.success(`Welcome, ${user.name}!`)
      if (user.role === 'student') navigate('/student/home')
      else if (user.role === 'teacher') navigate('/teacher/home')
      else navigate('/admin/home')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span className="text-2xl font-bold text-primary">JSS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Jai Shree Shyam Institute</h1>
          <p className="text-purple-200 text-sm mt-1">Student & Staff Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                placeholder="e.g. S_01, T_01, ADMIN_01"
                value={userID}
                onChange={e => setUserID(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full py-2.5" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700 font-medium mb-1">Demo credentials:</p>
            <p className="text-xs text-purple-600">Admin: ADMIN_01 / JSS230</p>
            <p className="text-xs text-purple-600">Teacher: T_01 / JSS230</p>
            <p className="text-xs text-purple-600">Student: S_01 / JSS230</p>
          </div>

          <p className="text-center mt-4">
            <a href="/" className="text-sm text-primary hover:underline">← Back to home</a>
          </p>
        </div>
      </div>
    </div>
  )
}