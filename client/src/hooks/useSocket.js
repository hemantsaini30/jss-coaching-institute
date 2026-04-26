import { useEffect } from 'react';
import { getSocket } from '../utils/socket';
import useNotifStore from '../store/notifStore';

export function useSocket() {
  const addNotification = useNotifStore(s => s.addNotification);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotif = (notif) => {
      addNotification(notif);
    };

    socket.on('notification:new', handleNotif);
    return () => socket.off('notification:new', handleNotif);
  }, [addNotification]);
}