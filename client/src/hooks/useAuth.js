import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';
import useNotifStore from '../store/notifStore';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (userID, password) => {
    const res = await api.post('/auth/login', { userID, password });
    const { accessToken, user: userData } = res.data;
    window.__jssToken = accessToken;
    setAuth(userData, accessToken);

    // Connect socket
    const socket = connectSocket(accessToken);
    if (userData.role === 'student') {
      socket.emit('join:class', userData.classID);
    } else {
      socket.emit('join:teachers');
    }

    // Redirect by role
    if (userData.role === 'admin') navigate('/admin/home');
    else if (userData.role === 'teacher') navigate('/teacher/home');
    else navigate('/student/home');

    return userData;
  }, [setAuth, navigate]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { }
    window.__jssToken = null;
    clearAuth();
    disconnectSocket();
    useNotifStore.getState().setNotifications([]);
    navigate('/login');
  }, [clearAuth, navigate]);

  return { user, token, isAuthenticated, login, logout };
}