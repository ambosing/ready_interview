import { ArrowRight, FileStack, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useDocuments } from '@/hooks/use-documents'
import { useJobPostings } from '@/hooks/use-job-postings'
import type { DocumentType, JobPosting } from '@/types'

const typeMap: Record<DocumentType, { label: string; className: string }> = {
  RESUME: { label: '이력서', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  PORTFOLIO: { label: '포트폴리오', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
}

function getJobPostingTitle(jobPostings: JobPosting[], jobPostingId: string) {
  return jobPostings.find((jobPosting) => jobPosting.id === jobPostingId)?.title ?? '연결된 채용 공고 정보 없음'
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useDocuments()
  const { data: jobPostingsData } = useJobPostings({ limit: 100 })
  const documents = data?.data ?? []
  const jobPostings = jobPostingsData?.data ?? []

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.16),transparent_34%),linear-gradient(135deg,theme(colors.muted/0.65),transparent_68%)]" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            생성 문서 보관함
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">서류 관리</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              생성된 이력서와 포트폴리오를 모아 보고 버전별로 다듬어 보세요.
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
          로딩 중...
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
          생성된 서류가 없습니다.
        </div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-2">
            {documents.map((document) => {
              const type = typeMap[document.type]

              return (
                <Card
                  key={document.id}
                  className="cursor-pointer gap-4 border-border/60 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/40"
                  onClick={() => navigate(`/documents/${document.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/documents/${document.id}`)
                    }
                  }}
                >
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <FileStack className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl leading-snug">{document.title}</CardTitle>
                          <CardDescription>{getJobPostingTitle(jobPostings, document.jobPostingId)}</CardDescription>
                        </div>
                      </div>
                      <Badge className={type.className}>{type.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{document.content}</p>
                    <Separator />
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span>{new Date(document.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        편집하기
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
