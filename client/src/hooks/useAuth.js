import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import { disconnectSocket } from '../utils/socket'

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (userID, password) => {
    const { data } = await api.post('/auth/login', { userID, password })
    setAuth(data.user, data.accessToken)
    return data.user
  }, [setAuth])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    clearAuth()
    disconnectSocket()
    navigate('/login')
  }, [clearAuth, navigate])

  return { user, accessToken, login, logout, isLoggedIn: !!user }
}