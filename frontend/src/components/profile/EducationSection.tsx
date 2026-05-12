import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { GraduationCap, PencilLine, Plus, Trash2 } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { useCreateEducation, useDeleteEducation, useUpdateEducation } from '@/hooks/use-profile'
import type { Education } from '@/types'

type EducationSectionProps = {
  educations: Education[]
}

type FormState = {
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
  description: string
}

const emptyForm: FormState = {
  school: '',
  major: '',
  degree: '',
  startDate: '',
  endDate: '',
  description: '',
}

function toDateInputValue(value: string | null) {
  return value ? value.split('T')[0] : ''
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatPeriod(startDate: string, endDate: string | null) {
  const start = toDateInputValue(startDate)
  const end = toDateInputValue(endDate)
  return `${start} ~ ${end || '현재'}`
}

export function EducationSection({ educations }: EducationSectionProps) {
  const createEducation = useCreateEducation()
  const updateEducation = useUpdateEducation()
  const deleteEducation = useDeleteEducation()
  const [open, setOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<Education | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!editingEducation) {
      setForm(emptyForm)
      return
    }

    setForm({
      school: editingEducation.school,
      major: editingEducation.major,
      degree: editingEducation.degree,
      startDate: toDateInputValue(editingEducation.startDate),
      endDate: toDateInputValue(editingEducation.endDate),
      description: editingEducation.description ?? '',
    })
  }, [editingEducation])

  const isPending = createEducation.isPending || updateEducation.isPending || deleteEducation.isPending
  const dialogTitle = useMemo(() => (editingEducation ? '학력 정보 수정' : '학력 정보 추가'), [editingEducation])

  const handleCreate = () => {
    setEditingEducation(null)
    setOpen(true)
  }

  const handleEdit = (education: Education) => {
    setEditingEducation(education)
    setOpen(true)
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    const payload = {
      school: form.school.trim(),
      major: form.major.trim(),
      degree: form.degree.trim(),
      startDate: form.startDate,
      endDate: toNullableValue(form.endDate),
      description: toNullableValue(form.description),
    }

    if (editingEducation) {
      await updateEducation.mutateAsync({ id: editingEducation.id, ...payload })
    } else {
      await createEducation.mutateAsync(payload)
    }

    setOpen(false)
    setEditingEducation(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('이 학력 정보를 삭제하시겠습니까?')

    if (!confirmed) {
      return
    }

    await deleteEducation.mutateAsync(id)
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>학력</CardTitle>
          <CardDescription>학교, 전공, 학위와 함께 학업 경험을 정리해 주세요.</CardDescription>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="size-4" />
          학력 추가
        </Button>
      </CardHeader>
      <CardContent>
        {educations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <GraduationCap className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">등록된 학력 정보가 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">학력을 추가해 지원서의 기본 신뢰도를 높여보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {educations.map((education) => (
              <div key={education.id} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-base font-semibold">{education.school}</h3>
                      <p className="text-sm text-muted-foreground">{education.major} · {education.degree}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatPeriod(education.startDate, education.endDate)}</p>
                    {education.description ? <p className="text-sm leading-6 text-foreground/80">{education.description}</p> : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleEdit(education)}>
                      <PencilLine className="size-4" />
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDelete(education.id)} disabled={isPending}>
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>학업 배경을 구체적으로 입력해 주세요.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="education-school">학교명</Label>
                  <Input id="education-school" placeholder="예: 서울대학교" value={form.school} onChange={(event) => setForm((current) => ({ ...current, school: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education-major">전공</Label>
                  <Input id="education-major" placeholder="예: 컴퓨터공학과" value={form.major} onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="education-degree">학위</Label>
                  <Input id="education-degree" placeholder="예: 학사" value={form.degree} onChange={(event) => setForm((current) => ({ ...current, degree: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education-start-date">입학일</Label>
                  <Input id="education-start-date" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education-end-date">졸업일</Label>
                  <Input id="education-end-date" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="education-description">세부 설명</Label>
                <Textarea id="education-description" className="min-h-32" placeholder="주요 활동, 논문, 프로젝트 등을 적어 주세요." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={createEducation.isPending || updateEducation.isPending}>
                  {editingEducation ? '학력 저장' : '학력 추가'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default EducationSection
