import { BadgeCheck, BookOpenText, BriefcaseBusiness, FolderKanban, GraduationCap, Sparkles, Target, Trophy } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ProfileDetail } from '@/hooks/use-profile'

type ProfileCompletenessProps = {
  profile: ProfileDetail
  userName: string
}

const sections = [
  { key: 'basic', label: '기본 정보', weight: 20, icon: BookOpenText },
  { key: 'education', label: '학력', weight: 15, icon: GraduationCap },
  { key: 'career', label: '경력', weight: 20, icon: BriefcaseBusiness },
  { key: 'certification', label: '자격증', weight: 10, icon: Trophy },
  { key: 'project', label: '프로젝트', weight: 20, icon: FolderKanban },
  { key: 'skill', label: '기술', weight: 10, icon: Sparkles },
  { key: 'swot', label: 'SWOT', weight: 5, icon: Target },
] as const

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasSwotContent(profile: ProfileDetail) {
  const swot = profile.swotAnalysis
  return Boolean(
    swot && (swot.strengths.length > 0 || swot.weaknesses.length > 0 || swot.opportunities.length > 0 || swot.threats.length > 0),
  )
}

export function calculateProfileCompleteness(profile: ProfileDetail, userName: string) {
  const completedSections = {
    basic: Boolean(userName.trim()) && hasText(profile.phone) && hasText(profile.address) && hasText(profile.bio),
    education: profile.educations.length > 0,
    career: profile.careers.length > 0,
    certification: profile.certifications.length > 0,
    project: profile.projects.length > 0,
    skill: profile.skills.length > 0,
    swot: hasSwotContent(profile),
  }

  const percentage = sections.reduce((total, section) => {
    return completedSections[section.key] ? total + section.weight : total
  }, 0)

  return { percentage, completedSections }
}

export function ProfileCompleteness({ profile, userName }: ProfileCompletenessProps) {
  const { percentage, completedSections } = calculateProfileCompleteness(profile, userName)

  return (
    <Card className="overflow-hidden border-border/60 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.14),transparent_30%),linear-gradient(135deg,theme(colors.card),theme(colors.background))] shadow-sm">
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <BadgeCheck className="size-3.5 text-primary" />
            프로필 완성도
          </div>
          <CardTitle className="text-2xl">지원 준비도를 한눈에 관리하세요</CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
            핵심 항목을 채울수록 자기소개서 생성과 면접 준비의 품질이 더 높아집니다.
          </CardDescription>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">현재 완성도</p>
          <p className="text-4xl font-semibold tracking-tight">{percentage}%</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={percentage} className="h-3" />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon
            const isComplete = completedSections[section.key]

            return (
              <div
                key={section.key}
                className={cn(
                  'rounded-2xl border px-4 py-3 transition-colors',
                  isComplete ? 'border-primary/30 bg-primary/8' : 'border-border/60 bg-background/70',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('flex size-9 items-center justify-center rounded-xl', isComplete ? 'bg-primary/14 text-primary' : 'bg-muted text-muted-foreground')}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{section.label}</p>
                      <p className="text-xs text-muted-foreground">가중치 {section.weight}%</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-medium', isComplete ? 'text-primary' : 'text-muted-foreground')}>
                    {isComplete ? '완료' : '미완료'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfileCompleteness
