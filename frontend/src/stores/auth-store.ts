import { create } from 'zustand'

import { AUTH_TOKEN_KEY } from '@/lib/api'
import type { User } from '@/types'

const REFRESH_TOKEN_KEY = 'hirey-refresh-token'
const AUTH_LOGOUT_EVENT = 'hirey:logout'
const AUTH_REFRESHED_EVENT = 'hirey:refreshed'

const getStoredItem = (key: string) =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(key)

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAuth: (payload: { user: User; accessToken: string; refreshToken: string }) => void
  logout: () => void
}

const initialAccessToken = getStoredItem(AUTH_TOKEN_KEY)
const initialRefreshToken = getStoredItem(REFRESH_TOKEN_KEY)

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialAccessToken),
  setUser: (user) => {
    set((state) => ({ ...state, user }))
  },
  setAuth: ({ user, accessToken, refreshToken }) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    set({ user, accessToken, refreshToken, isAuthenticated: true })
  },
  logout: () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_LOGOUT_EVENT, () => {
    useAuthStore.getState().logout()
  })

  window.addEventListener(AUTH_REFRESHED_EVENT, (event) => {
    const detail = (event as CustomEvent<{ accessToken: string; refreshToken: string }>).detail

    useAuthStore.setState((state) => ({
      ...state,
      accessToken: detail.accessToken,
      refreshToken: detail.refreshToken,
      isAuthenticated: true,
    }))
  })
}
