import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Briefcase, CircleCheckBig, FileText, Sparkles, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiListResponse, ApiResponse, Application, ApplicationStatus } from '@/types'

type DashboardCounts = Record<'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER', number>

const emptyCounts: DashboardCounts = {
  APPLIED: 0,
  SCREENING: 0,
  INTERVIEW: 0,
  OFFER: 0,
}

const summaryCards: Array<{
  key: keyof DashboardCounts
  title: string
  description: string
  icon: typeof Briefcase
}> = [
  { key: 'APPLIED', title: '지원중', description: '제출 완료한 지원 건수', icon: Briefcase },
  { key: 'SCREENING', title: '서류합격', description: '서류 전형 통과 건수', icon: FileText },
  { key: 'INTERVIEW', title: '면접예정', description: '다가오는 면접 일정', icon: Users },
  { key: 'OFFER', title: '최종합격', description: '오퍼를 받은 포지션', icon: CircleCheckBig },
] 

function isApplicationStatus(value: string): value is ApplicationStatus {
  return ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'].includes(value)
}

function isApplication(value: unknown): value is Application {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.status === 'string' && isApplicationStatus(candidate.status)
}

function extractApplications(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.filter(isApplication)
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const data = (payload as { data?: unknown }).data

  if (Array.isArray(data)) {
    return data.filter(isApplication)
  }

  return []
}

async function fetchDashboardCounts() {
  try {
    const response = await api.get<ApiListResponse<Application> | ApiResponse<Application[]>>('/applications')
    const applications = extractApplications(response.data)

    return applications.reduce<DashboardCounts>((counts, application) => {
      if (application.status in counts) {
        const key = application.status as keyof DashboardCounts
        counts[key] += 1
      }

      return counts
    }, { ...emptyCounts })
  } catch {
    return emptyCounts
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: counts = emptyCounts } = useQuery({
    queryKey: ['dashboard', 'application-status-counts'],
    queryFn: fetchDashboardCounts,
  })

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.14),transparent_32%),linear-gradient(135deg,theme(colors.muted/0.65),transparent_65%)]" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            AI 리크루팅 어시스턴트
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {user?.name ? `${user.name}님, 안녕하세요!` : '환영합니다!'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              지원 현황과 다음 액션을 한 눈에 확인하고, 맞춤형 서류와 면접 준비를 이어가세요.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <Card key={card.key} className="gap-4 border-border/60">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardDescription>{card.title}</CardDescription>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
                <CardTitle className="text-3xl">{counts[card.key]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>가장 많이 사용하는 핵심 작업으로 바로 이동하세요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button className="h-auto justify-between rounded-2xl px-4 py-4" variant="outline" onClick={() => navigate('/profile')}>
              <span>프로필 작성</span>
              <ArrowRight className="size-4" />
            </Button>
            <Button className="h-auto justify-between rounded-2xl px-4 py-4" variant="outline" onClick={() => navigate('/job-postings/new')}>
              <span>채용 공고 등록</span>
              <ArrowRight className="size-4" />
            </Button>
            <Button className="h-auto justify-between rounded-2xl px-4 py-4" variant="outline" onClick={() => navigate('/documents')}>
              <span>서류 생성</span>
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
