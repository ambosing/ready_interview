import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { BriefcaseBusiness, PencilLine, Plus, Trash2 } from 'lucide-react'

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
import { useCreateCareer, useDeleteCareer, useUpdateCareer } from '@/hooks/use-profile'
import type { Career } from '@/types'

type CareerSectionProps = {
  careers: Career[]
}

type FormState = {
  company: string
  position: string
  department: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

const emptyForm: FormState = {
  company: '',
  position: '',
  department: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
}

function toDateInputValue(value: string | null) {
  return value ? value.split('T')[0] : ''
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatPeriod(startDate: string, endDate: string | null, isCurrent: boolean) {
  const start = toDateInputValue(startDate)
  if (isCurrent) {
    return `${start} ~ 재직 중`
  }

  return `${start} ~ ${toDateInputValue(endDate) || '현재'}`
}

export function CareerSection({ careers }: CareerSectionProps) {
  const createCareer = useCreateCareer()
  const updateCareer = useUpdateCareer()
  const deleteCareer = useDeleteCareer()
  const [open, setOpen] = useState(false)
  const [editingCareer, setEditingCareer] = useState<Career | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!editingCareer) {
      setForm(emptyForm)
      return
    }

    setForm({
      company: editingCareer.company,
      position: editingCareer.position,
      department: editingCareer.department ?? '',
      startDate: toDateInputValue(editingCareer.startDate),
      endDate: toDateInputValue(editingCareer.endDate),
      isCurrent: editingCareer.isCurrent,
      description: editingCareer.description ?? '',
    })
  }, [editingCareer])

  const dialogTitle = useMemo(() => (editingCareer ? '경력 정보 수정' : '경력 정보 추가'), [editingCareer])
  const isPending = createCareer.isPending || updateCareer.isPending || deleteCareer.isPending

  const handleCreate = () => {
    setEditingCareer(null)
    setOpen(true)
  }

  const handleEdit = (career: Career) => {
    setEditingCareer(career)
    setOpen(true)
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    const payload = {
      company: form.company.trim(),
      position: form.position.trim(),
      department: toNullableValue(form.department),
      startDate: form.startDate,
      endDate: form.isCurrent ? null : toNullableValue(form.endDate),
      isCurrent: form.isCurrent,
      description: toNullableValue(form.description),
    }

    if (editingCareer) {
      await updateCareer.mutateAsync({ id: editingCareer.id, ...payload })
    } else {
      await createCareer.mutateAsync(payload)
    }

    setOpen(false)
    setEditingCareer(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('이 경력 정보를 삭제하시겠습니까?')

    if (!confirmed) {
      return
    }

    await deleteCareer.mutateAsync(id)
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>경력</CardTitle>
          <CardDescription>직무와 성과 중심으로 경력 이력을 정리해 보세요.</CardDescription>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="size-4" />
          경력 추가
        </Button>
      </CardHeader>
      <CardContent>
        {careers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <BriefcaseBusiness className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">등록된 경력 정보가 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">경력 사항을 입력해 실무 경험과 역할을 강조해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {careers.map((career) => (
              <div key={career.id} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-base font-semibold">{career.company}</h3>
                      <p className="text-sm text-muted-foreground">
                        {career.position}
                        {career.department ? ` · ${career.department}` : ''}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatPeriod(career.startDate, career.endDate, career.isCurrent)}</p>
                    {career.description ? <p className="text-sm leading-6 text-foreground/80">{career.description}</p> : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleEdit(career)}>
                      <PencilLine className="size-4" />
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDelete(career.id)} disabled={isPending}>
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
              <DialogDescription>회사와 역할, 주요 성과를 분명하게 적어 주세요.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="career-company">회사명</Label>
                  <Input id="career-company" placeholder="예: 하이어리" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="career-position">직무</Label>
                  <Input id="career-position" placeholder="예: 프론트엔드 개발자" value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="career-department">부서</Label>
                  <Input id="career-department" placeholder="예: 프로덕트팀" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="career-start-date">시작일</Label>
                  <Input id="career-start-date" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="career-end-date">종료일</Label>
                  <Input id="career-end-date" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} disabled={form.isCurrent} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <Button type="button" variant={form.isCurrent ? 'default' : 'outline'} size="sm" onClick={() => setForm((current) => ({ ...current, isCurrent: !current.isCurrent, endDate: current.isCurrent ? current.endDate : '' }))}>
                  {form.isCurrent ? '재직 중으로 표시됨' : '현재 재직 중'}
                </Button>
                <p className="text-xs text-muted-foreground">현재 근무 중이라면 종료일 없이 저장할 수 있습니다.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="career-description">주요 업무 및 성과</Label>
                <Textarea id="career-description" className="min-h-32" placeholder="담당한 프로젝트, 협업 범위, 성과 지표 등을 입력해 주세요." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={createCareer.isPending || updateCareer.isPending}>
                  {editingCareer ? '경력 저장' : '경력 추가'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default CareerSection
