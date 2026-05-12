import { ArrowRight, ExternalLink, LoaderCircle, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useApplication, useUpdateApplication } from '@/hooks/use-applications'
import { useJobPosting } from '@/hooks/use-job-postings'
import { cn } from '@/lib/utils'
import type {
  ApplicationStatus,
  GeneratedDocument,
  InterviewSession,
  JobPosting,
  SelfEvaluation,
} from '@/types'

const statusOptions: Array<{ label: string; value: ApplicationStatus }> = [
  { label: '지원중', value: 'APPLIED' },
  { label: '서류합격', value: 'SCREENING' },
  { label: '면접예정', value: 'INTERVIEW' },
  { label: '최종합격', value: 'OFFER' },
  { label: '불합격', value: 'REJECTED' },
  { label: '철회', value: 'WITHDRAWN' },
]

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: '지원중',
  SCREENING: '서류합격',
  INTERVIEW: '면접예정',
  OFFER: '최종합격',
  REJECTED: '불합격',
  WITHDRAWN: '철회',
}

const statusBadgeClassNames: Record<ApplicationStatus, string> = {
  APPLIED: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  SCREENING: 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  INTERVIEW: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  OFFER: 'border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
  REJECTED: 'border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  WITHDRAWN: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

const interviewStatusLabels: Record<InterviewSession['status'], string> = {
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
}

const interviewTypeLabels: Record<InterviewSession['type'], string> = {
  TEXT: '텍스트 면접',
  VOICE: '음성 면접',
}

const interviewDifficultyLabels: Record<InterviewSession['difficulty'], string> = {
  BASIC: '기초',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR')
}

function getEvaluationSummary(evaluation: SelfEvaluation) {
  return evaluation.notes ?? evaluation.improvements ?? evaluation.strengths ?? '기록된 상세 내용이 없습니다.'
}

function SectionEmpty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}

export default function ApplicationDetailPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { data: application, isPending, isError } = useApplication(id)
  const { data: jobPostingDetail } = useJobPosting(application?.jobPostingId ?? '')
  const updateApplication = useUpdateApplication()
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('APPLIED')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!application) {
      return
    }

    setSelectedStatus(application.status)
    setNotes(application.notes ?? '')
  }, [application])

  const linkedDocuments = useMemo<GeneratedDocument[]>(() => jobPostingDetail?.documents ?? [], [jobPostingDetail])
  const jobPosting = useMemo<JobPosting | undefined>(() => application?.jobPosting, [application])
  const interviews = useMemo<InterviewSession[]>(() => application?.interviews ?? [], [application])
  const evaluations = useMemo<SelfEvaluation[]>(() => application?.evaluations ?? [], [application])

  if (isPending) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex min-h-56 items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          지원 상세 정보를 불러오는 중입니다.
        </CardContent>
      </Card>
    )
  }

  if (isError || !application || !jobPosting) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">지원 정보를 불러오지 못했습니다.</CardContent>
      </Card>
    )
  }

  const hasChanges = selectedStatus !== application.status || notes !== (application.notes ?? '')

  const handleSave = async () => {
    await updateApplication.mutateAsync({
      id: application.id,
      status: selectedStatus,
      notes: notes.trim() ? notes : '',
    })
  }

  const openJobPosting = () => {
    if (!jobPosting.url) {
      toast.info('등록된 공고 링크가 없습니다.')
      return
    }

    window.open(jobPosting.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.16),transparent_34%),linear-gradient(140deg,theme(colors.muted/0.65),transparent_68%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              지원 상세
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{jobPosting.title}</h1>
                <Badge
                  variant="outline"
                  className={cn('rounded-full border px-3 py-1 text-xs font-semibold', statusBadgeClassNames[application.status])}
                >
                  {statusLabels[application.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground md:text-base">{jobPosting.company ?? '회사 정보 없음'} · 지원일 {formatDate(application.appliedAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/applications')}>
              지원 목록
            </Button>
            <Button variant="outline" onClick={openJobPosting}>
              공고 보기
              <ExternalLink className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>지원 정보</CardTitle>
              <CardDescription>전형 상태와 메모를 한 번에 조정할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>회사</Label>
                  <div className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 text-sm font-medium">
                    {jobPosting.company ?? '회사 정보 없음'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>포지션</Label>
                  <div className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 text-sm font-medium">
                    {jobPosting.title}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application-detail-status">상태 변경</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ApplicationStatus)}>
                  <SelectTrigger id="application-detail-status" className="w-full md:max-w-xs">
                    <SelectValue placeholder="상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application-detail-notes">메모</Label>
                <Textarea
                  id="application-detail-notes"
                  className="min-h-44"
                  placeholder="연락 일정, 준비 포인트, 제출 서류 메모를 자유롭게 남겨 보세요."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateApplication.isPending || !hasChanges}>
                  {updateApplication.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>연결된 서류</CardTitle>
                  <CardDescription>이 공고를 기준으로 생성된 문서를 바로 열 수 있습니다.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
                  서류 보관함
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linkedDocuments.length === 0 ? (
                <SectionEmpty text="연결된 서류가 없습니다." />
              ) : (
                <div className="space-y-3">
                  {linkedDocuments.map((document) => (
                    <button
                      key={document.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/45"
                      onClick={() => navigate(`/documents/${document.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{document.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {document.type === 'RESUME' ? '이력서' : '포트폴리오'} · {formatDate(document.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">열기</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>면접 세션</CardTitle>
                  <CardDescription>연결된 면접 연습 이력을 단계별로 확인하세요.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/interviews')}>
                  면접 준비
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {interviews.length === 0 ? (
                <SectionEmpty text="등록된 면접 세션이 없습니다." />
              ) : (
                <ScrollArea className="h-72 pr-4">
                  <div className="space-y-3">
                    {interviews.map((interview) => (
                      <button
                        key={interview.id}
                        type="button"
                        className="w-full rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/45"
                        onClick={() => navigate(`/interviews/${interview.id}`)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium">{interviewTypeLabels[interview.type]}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(interview.startedAt)} · {interviewDifficultyLabels[interview.difficulty]}
                            </p>
                          </div>
                          <Badge variant="outline">{interviewStatusLabels[interview.status]}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>자기 평가</CardTitle>
                  <CardDescription>연습 이후 남긴 회고와 개선 포인트를 모아 봅니다.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/interviews')}>
                  면접 페이지로 이동
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <SectionEmpty text="작성된 자기 평가가 없습니다." />
              ) : (
                <div className="space-y-3">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium">평가 점수 {evaluation.performance}/10</p>
                          <p className="text-sm text-muted-foreground">{formatDate(evaluation.createdAt)}</p>
                        </div>
                        <Badge variant="secondary">회고</Badge>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-3 text-sm leading-6">
                        {evaluation.strengths ? (
                          <div>
                            <p className="font-medium">강점</p>
                            <p className="mt-1 text-muted-foreground">{evaluation.strengths}</p>
                          </div>
                        ) : null}
                        {evaluation.improvements ? (
                          <div>
                            <p className="font-medium">개선점</p>
                            <p className="mt-1 text-muted-foreground">{evaluation.improvements}</p>
                          </div>
                        ) : null}
                        {evaluation.questionsAsked ? (
                          <div>
                            <p className="font-medium">받은 질문</p>
                            <p className="mt-1 text-muted-foreground">{evaluation.questionsAsked}</p>
                          </div>
                        ) : null}
                        {!evaluation.strengths && !evaluation.improvements && !evaluation.questionsAsked && !evaluation.notes ? (
                          <p className="text-muted-foreground">{getEvaluationSummary(evaluation)}</p>
                        ) : null}
                        {evaluation.notes ? (
                          <div>
                            <p className="font-medium">메모</p>
                            <p className="mt-1 text-muted-foreground">{evaluation.notes}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
