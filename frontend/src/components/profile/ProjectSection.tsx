import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { FolderKanban, PencilLine, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { useCreateProject, useDeleteProject, useUpdateProject } from '@/hooks/use-profile'
import type { Project } from '@/types'

type ProjectSectionProps = {
  projects: Project[]
}

type FormState = {
  name: string
  description: string
  role: string
  techStack: string
  startDate: string
  endDate: string
  achievements: string
  url: string
}

const emptyForm: FormState = {
  name: '',
  description: '',
  role: '',
  techStack: '',
  startDate: '',
  endDate: '',
  achievements: '',
  url: '',
}

function toDateInputValue(value: string | null) {
  return value ? value.split('T')[0] : ''
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseTechStack(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function ProjectSection({ projects }: ProjectSectionProps) {
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!editingProject) {
      setForm(emptyForm)
      return
    }

    setForm({
      name: editingProject.name,
      description: editingProject.description,
      role: editingProject.role,
      techStack: editingProject.techStack.join(', '),
      startDate: toDateInputValue(editingProject.startDate),
      endDate: toDateInputValue(editingProject.endDate),
      achievements: editingProject.achievements ?? '',
      url: editingProject.url ?? '',
    })
  }, [editingProject])

  const dialogTitle = useMemo(() => (editingProject ? '프로젝트 수정' : '프로젝트 추가'), [editingProject])
  const isPending = createProject.isPending || updateProject.isPending || deleteProject.isPending

  const handleCreate = () => {
    setEditingProject(null)
    setOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setOpen(true)
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      role: form.role.trim(),
      techStack: parseTechStack(form.techStack),
      startDate: form.startDate,
      endDate: toNullableValue(form.endDate),
      achievements: toNullableValue(form.achievements),
      url: toNullableValue(form.url),
    }

    if (editingProject) {
      await updateProject.mutateAsync({ id: editingProject.id, ...payload })
    } else {
      await createProject.mutateAsync(payload)
    }

    setOpen(false)
    setEditingProject(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('이 프로젝트를 삭제하시겠습니까?')

    if (!confirmed) {
      return
    }

    await deleteProject.mutateAsync(id)
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>프로젝트</CardTitle>
          <CardDescription>주도한 역할과 사용 기술, 성과를 한눈에 보이게 정리해 주세요.</CardDescription>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="size-4" />
          프로젝트 추가
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <FolderKanban className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">등록된 프로젝트가 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">실제 문제 해결 경험을 보여줄 대표 프로젝트를 추가해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.role}</p>
                    </div>
                    <p className="text-sm leading-6 text-foreground/80">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="rounded-full px-3 py-1">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {toDateInputValue(project.startDate)} ~ {toDateInputValue(project.endDate) || '현재'}
                    </p>
                    {project.achievements ? <p className="text-sm leading-6 text-foreground/80">주요 성과: {project.achievements}</p> : null}
                    {project.url ? <a className="inline-flex text-sm font-medium text-primary underline underline-offset-4" href={project.url} target="_blank" rel="noreferrer">프로젝트 링크 보기</a> : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleEdit(project)}>
                      <PencilLine className="size-4" />
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDelete(project.id)} disabled={isPending}>
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
              <DialogDescription>프로젝트 배경과 성과를 구조적으로 입력해 주세요.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">프로젝트명</Label>
                  <Input id="project-name" placeholder="예: AI 면접 어시스턴트" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-role">담당 역할</Label>
                  <Input id="project-role" placeholder="예: 프론트엔드 리드" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">프로젝트 설명</Label>
                <Textarea id="project-description" className="min-h-32" placeholder="어떤 문제를 해결했는지와 본인의 기여를 중심으로 작성해 주세요." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-tech-stack">기술 스택</Label>
                <Input id="project-tech-stack" placeholder="예: React, TypeScript, Tailwind CSS" value={form.techStack} onChange={(event) => setForm((current) => ({ ...current, techStack: event.target.value }))} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-start-date">시작일</Label>
                  <Input id="project-start-date" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-end-date">종료일</Label>
                  <Input id="project-end-date" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-achievements">주요 성과</Label>
                  <Textarea id="project-achievements" placeholder="예: 전환율 18% 향상, 응답 속도 35% 개선" value={form.achievements} onChange={(event) => setForm((current) => ({ ...current, achievements: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-url">프로젝트 링크</Label>
                  <Input id="project-url" placeholder="예: https://example.com" value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={createProject.isPending || updateProject.isPending}>
                  {editingProject ? '프로젝트 저장' : '프로젝트 추가'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ProjectSection
