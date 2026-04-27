import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  authModalTab: 'login' | 'register'

  setAuth:        (user: User, accessToken: string, refreshToken: string) => void
  setUser:        (user: User) => void
  logout:         () => void
  openAuthModal:  (tab?: 'login' | 'register') => void
  closeAuthModal: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null,
      isAuthenticated: false, isAuthModalOpen: false, authModalTab: 'login',

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('fsn_access_token', accessToken)
        localStorage.setItem('fsn_refresh_token', refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true, isAuthModalOpen: false })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('fsn_access_token')
        localStorage.removeItem('fsn_refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      openAuthModal:  (tab = 'login') => set({ isAuthModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
    }),
    {
      name: 'fsn-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
