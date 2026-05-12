import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
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

type SignupFormValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>

function validateSignupForm(values: SignupFormValues) {
  const errors: SignupFormErrors = {}

  if (!values.name.trim()) {
    errors.name = '이름을 입력해주세요.'
  }

  if (!values.email.trim()) {
    errors.email = '이메일을 입력해주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = '올바른 이메일 형식을 입력해주세요.'
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해주세요.'
  } else if (values.password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
  }

  return errors
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [values, setValues] = useState<SignupFormValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleChange = (field: keyof SignupFormValues, value: string) => {
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

    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/signup', {
        name: values.name,
        email: values.email,
        password: values.password,
      })

      setAuth(response.data.data)
      navigate('/', { replace: true })
      toast.success('회원가입이 완료되었습니다.')
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? error.message
        : '회원가입에 실패했습니다.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.16),transparent_35%),linear-gradient(160deg,theme(colors.muted/0.55),transparent_60%)]" />
      <Card className="relative z-10 w-full max-w-md border-border/60 bg-background/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>Hirey와 함께 맞춤형 채용 준비를 시작하세요.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={values.name}
                onChange={(event) => handleChange('name', event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
            </div>

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
                placeholder="8자 이상 입력해주세요"
                value={values.password}
                onChange={(event) => handleChange('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={values.confirmPassword}
                onChange={(event) => handleChange('confirmPassword', event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              ) : null}
            </div>

            <Button className="h-11 w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '가입 중...' : '회원가입'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link className="font-medium text-foreground underline underline-offset-4" to="/login">
                로그인
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
