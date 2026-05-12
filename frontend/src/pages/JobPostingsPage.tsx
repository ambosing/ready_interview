import { ArrowRight, BriefcaseBusiness, Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useJobPostings } from '@/hooks/use-job-postings'
import { cn } from '@/lib/utils'
import type { JobPosting, JobPostingStatus } from '@/types'

const statusMap: Record<JobPostingStatus, { label: string; className: string }> = {
  DRAFT: { label: '초안', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300' },
  ANALYZED: { label: '분석 완료', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  APPLIED: { label: '지원 완료', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
}

function getDocumentCountLabel(jobPosting: JobPosting) {
  const keywordCount = (() => {
    try {
      const parsed: unknown = JSON.parse(jobPosting.analyzedKeywords || '[]')
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  })()

  if (jobPosting.status === 'DRAFT') {
    return '분석 대기 중'
  }

  return `핵심 키워드 ${keywordCount}개 추출`
}

export default function JobPostingsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useJobPostings()
  const jobPostings = data?.data ?? []

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.14),transparent_32%),linear-gradient(135deg,theme(colors.muted/0.7),transparent_65%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              채용 공고 아카이브
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">채용 공고</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
                  목표 포지션을 정리하고 분석 가능한 채용 공고를 한 곳에서 관리하세요.
              </p>
            </div>
          </div>

          <Button className="rounded-2xl" onClick={() => navigate('/job-postings/new')}>
            <Plus className="size-4" />
            새 채용 공고
          </Button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
          로딩 중...
        </div>
      ) : jobPostings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
          등록된 채용 공고가 없습니다.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {jobPostings.map((jobPosting) => {
            const status = statusMap[jobPosting.status]

            return (
              <Card
                key={jobPosting.id}
                className="cursor-pointer gap-4 border-border/60 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/40"
                onClick={() => navigate(`/job-postings/${jobPosting.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/job-postings/${jobPosting.id}`)
                  }
                }}
              >
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <BriefcaseBusiness className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl leading-snug">{jobPosting.title}</CardTitle>
                        <CardDescription>{jobPosting.company || '회사명 미입력'}</CardDescription>
                      </div>
                    </div>
                    <Badge className={cn('border-0', status.className)}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {getDocumentCountLabel(jobPosting)}
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                    <span>{new Date(jobPosting.createdAt).toLocaleDateString('ko-KR')}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      상세 보기
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </div>
  )
}
