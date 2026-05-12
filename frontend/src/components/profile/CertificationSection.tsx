import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { Award, PencilLine, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCertification, useDeleteCertification, useUpdateCertification } from '@/hooks/use-profile'
import type { Certification } from '@/types'

type CertificationSectionProps = {
  certifications: Certification[]
}

type FormState = {
  name: string
  issuer: string
  issueDate: string
  expiryDate: string
  credentialId: string
}

const emptyForm: FormState = {
  name: '',
  issuer: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
}

function toDateInputValue(value: string | null) {
  return value ? value.split('T')[0] : ''
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function CertificationSection({ certifications }: CertificationSectionProps) {
  const createCertification = useCreateCertification()
  const updateCertification = useUpdateCertification()
  const deleteCertification = useDeleteCertification()
  const [open, setOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!editingCertification) {
      setForm(emptyForm)
      return
    }

    setForm({
      name: editingCertification.name,
      issuer: editingCertification.issuer,
      issueDate: toDateInputValue(editingCertification.issueDate),
      expiryDate: toDateInputValue(editingCertification.expiryDate),
      credentialId: editingCertification.credentialId ?? '',
    })
  }, [editingCertification])

  const dialogTitle = useMemo(() => (editingCertification ? '자격증 수정' : '자격증 추가'), [editingCertification])
  const isPending = createCertification.isPending || updateCertification.isPending || deleteCertification.isPending

  const handleCreate = () => {
    setEditingCertification(null)
    setOpen(true)
  }

  const handleEdit = (certification: Certification) => {
    setEditingCertification(certification)
    setOpen(true)
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    const payload = {
      name: form.name.trim(),
      issuer: form.issuer.trim(),
      issueDate: form.issueDate,
      expiryDate: toNullableValue(form.expiryDate),
      credentialId: toNullableValue(form.credentialId),
    }

    if (editingCertification) {
      await updateCertification.mutateAsync({ id: editingCertification.id, ...payload })
    } else {
      await createCertification.mutateAsync(payload)
    }

    setOpen(false)
    setEditingCertification(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('이 자격증 정보를 삭제하시겠습니까?')

    if (!confirmed) {
      return
    }

    await deleteCertification.mutateAsync(id)
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>자격증</CardTitle>
          <CardDescription>직무 관련 자격과 발급 정보를 정리해 전문성을 보여주세요.</CardDescription>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="size-4" />
          자격증 추가
        </Button>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <Award className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">등록된 자격증 정보가 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">직무와 연결되는 인증 정보를 추가해 경쟁력을 높여보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.map((certification) => (
              <div key={certification.id} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-base font-semibold">{certification.name}</h3>
                      <p className="text-sm text-muted-foreground">{certification.issuer}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      발급일 {toDateInputValue(certification.issueDate)}
                      {certification.expiryDate ? ` · 만료일 ${toDateInputValue(certification.expiryDate)}` : ' · 만료일 없음'}
                    </p>
                    {certification.credentialId ? <p className="text-sm text-foreground/80">자격번호 {certification.credentialId}</p> : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleEdit(certification)}>
                      <PencilLine className="size-4" />
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDelete(certification.id)} disabled={isPending}>
                      <Trash2 className="size-4" />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>발급 기관과 유효 기간을 함께 관리해 주세요.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certification-name">자격증명</Label>
                  <Input id="certification-name" placeholder="예: 정보처리기사" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certification-issuer">발급기관</Label>
                  <Input id="certification-issuer" placeholder="예: 한국산업인력공단" value={form.issuer} onChange={(event) => setForm((current) => ({ ...current, issuer: event.target.value }))} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="certification-issue-date">발급일</Label>
                  <Input id="certification-issue-date" type="date" value={form.issueDate} onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certification-expiry-date">만료일</Label>
                  <Input id="certification-expiry-date" type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certification-credential-id">자격번호</Label>
                  <Input id="certification-credential-id" placeholder="예: 1234-5678" value={form.credentialId} onChange={(event) => setForm((current) => ({ ...current, credentialId: event.target.value }))} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={createCertification.isPending || updateCertification.isPending}>
                  {editingCertification ? '자격증 저장' : '자격증 추가'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default CertificationSection
