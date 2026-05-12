import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { api, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiResponse, User } from '@/types'

export function ProtectedRoute() {
  const location = useLocation()
  const { accessToken, isAuthenticated, setUser, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(Boolean(accessToken))

  useEffect(() => {
    let isMounted = true

    if (!accessToken) {
      setIsChecking(false)
      return () => {
        isMounted = false
      }
    }

    setIsChecking(true)

    api
      .get<ApiResponse<User>>('/auth/me')
      .then((response) => {
        if (!isMounted) {
          return
        }

        setUser(response.data.data)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        window.localStorage.removeItem(AUTH_TOKEN_KEY)
        window.localStorage.removeItem(REFRESH_TOKEN_KEY)
        logout()
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [accessToken, logout, setUser])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        인증 상태를 확인하는 중입니다...
      </div>
    )
  }

  return <Outlet />
}
