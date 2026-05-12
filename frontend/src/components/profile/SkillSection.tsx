import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { PencilLine, Sparkles, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCreateSkill, useDeleteSkill, useUpdateSkill } from '@/hooks/use-profile'
import type { Proficiency, Skill } from '@/types'

type SkillSectionProps = {
  skills: Skill[]
}

type FormState = {
  name: string
  category: string
  proficiency: Proficiency
}

const skillCategories = ['프로그래밍 언어', '프레임워크', '데이터베이스', '도구', '기타']

const proficiencyLabels: Record<Proficiency, string> = {
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
  EXPERT: '전문가',
}

const emptyForm: FormState = {
  name: '',
  category: skillCategories[0],
  proficiency: 'INTERMEDIATE',
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function SkillSection({ skills }: SkillSectionProps) {
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()
  const deleteSkill = useDeleteSkill()
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!editingSkill) {
      setForm(emptyForm)
      return
    }

    setForm({
      name: editingSkill.name,
      category: editingSkill.category ?? skillCategories[0],
      proficiency: editingSkill.proficiency,
    })
  }, [editingSkill])

  const groupedSkills = useMemo(() => {
    return skillCategories.map((category) => ({
      category,
      items: skills.filter((skill) => (skill.category ?? '기타') === category),
    }))
  }, [skills])

  const isPending = createSkill.isPending || updateSkill.isPending || deleteSkill.isPending

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    const payload = {
      name: form.name.trim(),
      category: toNullableValue(form.category),
      proficiency: form.proficiency,
    }

    if (editingSkill) {
      await updateSkill.mutateAsync({ id: editingSkill.id, ...payload })
    } else {
      await createSkill.mutateAsync(payload)
    }

    setEditingSkill(null)
    setForm(emptyForm)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('이 기술을 삭제하시겠습니까?')

    if (!confirmed) {
      return
    }

    await deleteSkill.mutateAsync(id)
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>보유 기술</CardTitle>
        <CardDescription>핵심 기술을 카테고리별로 정리하고 숙련도를 함께 표시해 주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4 rounded-3xl border border-border/60 bg-muted/20 p-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="skill-name">기술명</Label>
              <Input id="skill-name" placeholder="예: React" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>숙련도</Label>
              <Select value={form.proficiency} onValueChange={(value: Proficiency) => setForm((current) => ({ ...current, proficiency: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="숙련도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(proficiencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
              {editingSkill ? '기술 저장' : '기술 추가'}
            </Button>
          </div>

          {editingSkill ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
              <p className="text-sm text-muted-foreground">현재 <span className="font-medium text-foreground">{editingSkill.name}</span> 기술을 수정 중입니다.</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingSkill(null)}>
                수정 취소
              </Button>
            </div>
          ) : null}
        </form>

        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
            <Sparkles className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">등록된 기술이 없습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">자주 사용하는 기술과 숙련도를 입력해 전문 분야를 명확히 보여주세요.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedSkills.map((group) => (
              <div key={group.category} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground/80">{group.category}</h3>
                  <Separator className="flex-1" />
                </div>

                {group.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">아직 등록된 기술이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {group.items.map((skill) => (
                      <div key={skill.id} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2 shadow-sm">
                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">{skill.name}</Badge>
                        <span className="text-xs text-muted-foreground">{proficiencyLabels[skill.proficiency]}</span>
                        <Button type="button" variant="ghost" size="icon" className="size-7 rounded-full" onClick={() => setEditingSkill(skill)}>
                          <PencilLine className="size-3.5" />
                          <span className="sr-only">기술 수정</span>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7 rounded-full" onClick={() => handleDelete(skill.id)} disabled={isPending}>
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">기술 삭제</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SkillSection
