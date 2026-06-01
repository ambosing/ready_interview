import { create } from 'zustand'

import { AUTH_TOKEN_KEY } from '@/lib/api'
import { clearLegacyAiProviderConnections } from '@/lib/ai-models'
import type { User } from '@/types'

const LEGACY_REFRESH_TOKEN_KEY = 'hirey-refresh-token'
const AUTH_LOGOUT_EVENT = 'hirey:logout'
const AUTH_REFRESHED_EVENT = 'hirey:refreshed'

const getStoredItem = (key: string) =>
  typeof window === 'undefined' ? null : window.localStorage.getItem(key)

type AuthState = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAuth: (payload: { user: User; accessToken: string }) => void
  logout: () => void
}

const initialAccessToken = getStoredItem(AUTH_TOKEN_KEY)

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: initialAccessToken,
  isAuthenticated: Boolean(initialAccessToken),
  setUser: (user) => {
    set((state) => ({ ...state, user }))
  },
  setAuth: ({ user, accessToken }) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
    window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    set({ user, accessToken, isAuthenticated: true })
  },
  logout: () => {
    clearLegacyAiProviderConnections()
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
    window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
}))

if (typeof window !== 'undefined') {
  clearLegacyAiProviderConnections()
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)

  window.addEventListener(AUTH_LOGOUT_EVENT, () => {
    useAuthStore.getState().logout()
  })

  window.addEventListener(AUTH_REFRESHED_EVENT, (event) => {
    const detail = (event as CustomEvent<{ accessToken: string }>).detail

    useAuthStore.setState((state) => ({
      ...state,
      accessToken: detail.accessToken,
      isAuthenticated: true,
    }))
  })
}
