import axios, { type InternalAxiosRequestConfig } from 'axios'

const AUTH_TOKEN_KEY = 'hirey-token'
const LEGACY_REFRESH_TOKEN_KEY = 'hirey-refresh-token'
const AUTH_LOGOUT_EVENT = 'hirey:logout'
const AUTH_REFRESHED_EVENT = 'hirey:refreshed'

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type RefreshResponse = {
  data: {
    accessToken: string
  }
}

function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
}

function canRefreshAfterUnauthorized(request?: RetriableRequestConfig) {
  if (!request || request._retry) {
    return false
  }

  const url = request.url ?? ''
  return !['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout'].some((path) => url.includes(path))
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    if (error.response?.status === 401 && canRefreshAfterUnauthorized(originalRequest)) {
      const requestToRetry = originalRequest as RetriableRequestConfig
      requestToRetry._retry = true

      try {
        const response = await axios.post<RefreshResponse>('/api/auth/refresh', undefined, {
          withCredentials: true,
        })

        const { accessToken } = response.data.data

        window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
        window.dispatchEvent(
          new CustomEvent(AUTH_REFRESHED_EVENT, {
            detail: { accessToken },
          }),
        )

        requestToRetry.headers.Authorization = `Bearer ${accessToken}`

        return api(requestToRetry)
      } catch {
        clearStoredAuth()
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
      }
    }

    if (error.response?.status === 401) {
      clearStoredAuth()
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }

    return Promise.reject(error)
  },
)

export { AUTH_TOKEN_KEY }
