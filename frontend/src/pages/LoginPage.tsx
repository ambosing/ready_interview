import { isAxiosError } from 'axios'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiResponse, AuthResponse } from '@/types'

type LoginFormValues = {
  email: string
  password: string
}

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>

function validateLoginForm(values: LoginFormValues) {
  const errors: LoginFormErrors = {}

  if (!values.email.trim()) {
    errors.email = '이메일을 입력해주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = '올바른 이메일 형식을 입력해주세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해주세요.'
  }

  return errors
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', values)
      setAuth(response.data.data)
      navigate('/', { replace: true })
      toast.success('로그인되었습니다.')
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? error.message
        : '로그인에 실패했습니다.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary/0.14),transparent_40%),linear-gradient(135deg,theme(colors.muted/0.5),transparent_60%)]" />
      <Card className="relative z-10 w-full max-w-md border-border/60 bg-background/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Hirey 로그인</CardTitle>
            <CardDescription>AI 채용 준비를 한 곳에서 시작해보세요.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={values.email}
                onChange={(event) => handleChange('email', event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={values.password}
                onChange={(event) => handleChange('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
            </div>

            <Button className="h-11 w-full" type="submit" disabled={isSubmitting || hasErrors}>
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link className="font-medium text-foreground underline underline-offset-4" to="/signup">
                회원가입
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
