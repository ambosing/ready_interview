import { useEffect, useState, type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateProfile } from '@/hooks/use-profile'
import type { Profile } from '@/types'

type BasicInfoSectionProps = {
  profile: Profile
  userName: string
}

type FormState = {
  phone: string
  address: string
  bio: string
}

function createFormState(profile: Profile): FormState {
  return {
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    bio: profile.bio ?? '',
  }
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function BasicInfoSection({ profile, userName }: BasicInfoSectionProps) {
  const [form, setForm] = useState<FormState>(() => createFormState(profile))
  const updateProfile = useUpdateProfile()

  useEffect(() => {
    setForm(createFormState(profile))
  }, [profile])

  const isDirty =
    form.phone !== (profile.phone ?? '') ||
    form.address !== (profile.address ?? '') ||
    form.bio !== (profile.bio ?? '')

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    await updateProfile.mutateAsync({
      phone: toNullableValue(form.phone),
      address: toNullableValue(form.address),
      bio: toNullableValue(form.bio),
    })
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>연락처와 자기소개를 최신 상태로 유지해 채용 담당자에게 신뢰감을 주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">이름</Label>
              <Input id="profile-name" value={userName} readOnly disabled />
              <p className="text-xs text-muted-foreground">이름은 계정 정보에서 관리됩니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">전화번호</Label>
              <Input
                id="profile-phone"
                placeholder="예: 010-1234-5678"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-address">주소</Label>
            <Input
              id="profile-address"
              placeholder="예: 서울특별시 강남구 테헤란로 123"
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">자기소개</Label>
            <Textarea
              id="profile-bio"
              placeholder="채용 담당자가 빠르게 이해할 수 있도록 강점과 경험을 간결하게 소개해 주세요."
              className="min-h-40"
              value={form.bio}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? '저장 중...' : '기본 정보 저장'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default BasicInfoSection
