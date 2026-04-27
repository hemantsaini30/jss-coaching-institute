// client/src/store/authStore.js — replace entirely
import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user:        null,
  accessToken: null,
  setAuth: (user, accessToken) => {
    console.log('[AuthStore] setAuth called:', user?.userID, user?.role)
    set({ user, accessToken })
  },
  clearAuth: () => {
    console.log('[AuthStore] clearAuth called')
    set({ user: null, accessToken: null })
  },
  getToken: () => get().accessToken,
}))

export default useAuthStore