import { useEffect } from 'react'
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket'
import useAuthStore from '../store/authStore'
import useNotificationStore from '../store/notificationStore'

export function useSocket() {
  const user = useAuthStore(s => s.user)
  const addNotification = useNotificationStore(s => s.addNotification)

  useEffect(() => {
    if (!user) return
    const socket = connectSocket()

    if (user.role === 'student' && user.classID) {
      socket.emit('join:class', user.classID)
    }
    if (user.role === 'teacher' || user.role === 'admin') {
      socket.emit('join:teachers')
    }

    socket.on('notification:new', (notif) => addNotification(notif))
    socket.on('test:live', (test) => {
      addNotification({ message: `Live test started: ${test.title}`, createdAt: new Date() })
    })

    return () => {
      socket.off('notification:new')
      socket.off('test:live')
    }
  }, [user, addNotification])

  return getSocket()
}