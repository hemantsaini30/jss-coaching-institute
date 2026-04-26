import { create } from 'zustand'

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount:   0,
  addNotification: (notif) =>
    set(state => ({
      notifications: [notif, ...state.notifications].slice(0, 20),
      unreadCount:   state.unreadCount + 1,
    })),
  markRead: () => set({ unreadCount: 0 }),
  setNotifications: (list) => set({ notifications: list }),
}))

export default useNotificationStore