import { create } from 'zustand';

const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notif) => set(state => ({
    notifications: [notif, ...state.notifications].slice(0, 20),
    unreadCount: state.unreadCount + 1,
  })),

  setNotifications: (list) => set({ notifications: list, unreadCount: list.length }),

  markAllRead: () => set({ unreadCount: 0 }),
}));

export default useNotifStore;