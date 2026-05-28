import axios, { type InternalAxiosRequestConfig } from 'axios'

const AUTH_TOKEN_KEY = 'hirey-token'
const REFRESH_TOKEN_KEY = 'hirey-refresh-token'
const AUTH_LOGOUT_EVENT = 'hirey:logout'
const AUTH_REFRESHED_EVENT = 'hirey:refreshed'

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type RefreshResponse = {
  data: {
    accessToken: string
    refreshToken: string
  }
}

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true

      try {
        const response = await axios.post<RefreshResponse>('/api/auth/refresh', {
          refreshToken,
        })

        const { accessToken, refreshToken: nextRefreshToken } = response.data.data

        window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
        window.localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken)
        window.dispatchEvent(
          new CustomEvent(AUTH_REFRESHED_EVENT, {
            detail: { accessToken, refreshToken: nextRefreshToken },
          }),
        )

        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        return api(originalRequest)
      } catch {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.localStorage.removeItem(AUTH_TOKEN_KEY)
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
      }
    }

    if (error.response?.status === 401) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
      window.localStorage.removeItem(REFRESH_TOKEN_KEY)
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }

    return Promise.reject(error)
  },
)

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY }
