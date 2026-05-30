import { isAxiosError } from 'axios'
import { Bell, Bot, KeyRound, LoaderCircle, ShieldAlert, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { aiModelOptions, getStoredAiModel, setStoredAiModel } from '@/lib/ai-models'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { AiModel, ApiResponse, User } from '@/types'

type NotificationSettings = {
  emailSummary: boolean
  interviewReminder: boolean
  marketing: boolean
}

const initialNotifications: NotificationSettings = {
  emailSummary: true,
  interviewReminder: true,
  marketing: false,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback
  }

  return fallback
}

function ToggleRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
      <div className="space-y-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors ${
          checked ? 'border-primary/40 bg-primary/90' : 'border-border bg-muted'
        }`}
        onClick={onToggle}
      >
        <span
          className={`inline-block size-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [name, setName] = useState(user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedAiModel, setSelectedAiModel] = useState<AiModel>(() => getStoredAiModel())
  const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications)
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  const canSaveName = useMemo(() => name.trim().length > 0 && name.trim() !== (user?.name ?? ''), [name, user?.name])
  const selectedAiModelOption = aiModelOptions.find((option) => option.value === selectedAiModel)

  const handleAccountSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error('표시 이름을 입력해 주세요.')
      return
    }

    setIsSavingAccount(true)

    try {
      const response = await api.put<ApiResponse<User>>('/auth/me', { name: name.trim() })
      setUser(response.data.data)
      toast.success('계정 정보가 저장되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error, '계정 정보를 저장하지 못했습니다.'))
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handlePasswordSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('비밀번호 항목을 모두 입력해 주세요.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호와 확인 값이 일치하지 않습니다.')
      return
    }

    setIsSavingPassword(true)

    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('비밀번호가 변경되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error, '비밀번호를 변경하지 못했습니다.'))
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.16),transparent_34%),linear-gradient(145deg,theme(colors.muted/0.62),transparent_68%)]" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <ShieldAlert className="size-3.5 text-primary" />
            계정 설정
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">설정</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              계정 정보와 보안 옵션을 정리하고 알림 환경을 원하는 방식으로 맞춰 보세요.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-primary" />
              <CardTitle>계정 정보</CardTitle>
            </div>
            <CardDescription>표시 이름을 수정하고 현재 계정 정보를 확인할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleAccountSubmit}>
              <div className="space-y-2">
                <Label htmlFor="settings-email">이메일</Label>
                <Input id="settings-email" value={user?.email ?? ''} readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-name">표시 이름</Label>
                <Input id="settings-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingAccount || !canSaveName}>
                  {isSavingAccount ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  저장
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <CardTitle>비밀번호 변경</CardTitle>
            </div>
            <CardDescription>현재 비밀번호를 확인한 뒤 새 비밀번호로 업데이트합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <div className="space-y-2">
                <Label htmlFor="settings-current-password">현재 비밀번호</Label>
                <Input
                  id="settings-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-new-password">새 비밀번호</Label>
                  <Input
                    id="settings-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-confirm-password">새 비밀번호 확인</Label>
                  <Input
                    id="settings-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  변경
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <CardTitle>AI 모델 설정</CardTitle>
            </div>
            <CardDescription>공고 분석, 서류 생성, 모의 면접에 사용할 기본 프로바이더와 모델을 선택합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-ai-model">기본 AI 모델</Label>
              <Select
                value={selectedAiModel}
                onValueChange={(value) => {
                  setSelectedAiModel(value as AiModel)
                  setStoredAiModel(value as AiModel)
                  toast.success('AI 모델 기본값이 저장되었습니다.')
                }}
              >
                <SelectTrigger id="settings-ai-model" className="w-full">
                  <SelectValue placeholder="AI 모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  {aiModelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">{option.provider}</span>
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAiModelOption ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                현재 기본값: {selectedAiModelOption.provider} · {selectedAiModelOption.label}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <CardTitle>알림 설정</CardTitle>
            </div>
            <CardDescription>이 항목은 현재 화면 내에서만 동작하는 개인화 설정입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              label="주간 지원 요약"
              description="한 주 동안의 지원 현황을 요약해서 확인합니다."
              checked={notifications.emailSummary}
              onToggle={() => setNotifications((current) => ({ ...current, emailSummary: !current.emailSummary }))}
            />
            <ToggleRow
              label="면접 리마인더"
              description="다가오는 면접 준비를 잊지 않도록 알려줍니다."
              checked={notifications.interviewReminder}
              onToggle={() => setNotifications((current) => ({ ...current, interviewReminder: !current.interviewReminder }))}
            />
            <ToggleRow
              label="프로모션 소식"
              description="새 기능과 서비스 업데이트 소식을 받아봅니다."
              checked={notifications.marketing}
              onToggle={() => setNotifications((current) => ({ ...current, marketing: !current.marketing }))}
            />
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-4" />
              <CardTitle>위험 구역</CardTitle>
            </div>
            <CardDescription>계정 삭제는 실제로 실행되지 않으며 확인용 인터페이스만 제공합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-destructive/20 bg-background/80 p-4 text-sm text-muted-foreground">
              계정을 삭제하면 지원 기록, 생성 문서, 면접 데이터 접근이 제한될 수 있습니다. 실제 삭제는 연결되어 있지 않습니다.
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">계정 삭제</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>정말 계정을 삭제하시겠습니까?</DialogTitle>
                  <DialogDescription>
                    이 화면은 확인용 UI입니다. 실제 계정 삭제는 실행되지 않으며, 버튼을 눌러도 데이터는 유지됩니다.
                  </DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="rounded-2xl bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  원하시면 이후 단계에서 실제 삭제 플로우와 보안 확인 절차를 별도로 구현할 수 있습니다.
                </div>

                <DialogFooter>
                  <Button variant="outline">취소</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      toast.info('데모 화면이므로 실제 계정 삭제는 수행되지 않습니다.')
                    }}
                  >
                    삭제 확인
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
