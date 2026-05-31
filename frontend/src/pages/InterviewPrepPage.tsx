import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, MessagesSquare, Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useApplications } from '@/hooks/use-applications'
import { useCreateInterview, useExpectedInterviewQuestions, useInterviews } from '@/hooks/use-interviews'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { aiModelOptions, getStoredAiModel, setStoredAiModel } from '@/lib/ai-models'
import { cn } from '@/lib/utils'
import type { InterviewSessionListItem } from '@/hooks/use-interviews'
import type { AiModel, Application, InterviewDifficulty, InterviewStatus, InterviewType } from '@/types'

const typeLabels: Record<InterviewType, string> = {
  TEXT: '텍스트',
  VOICE: '음성',
}

const difficultyLabels: Record<InterviewDifficulty, string> = {
  BASIC: '기초',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
}

const statusLabels: Record<InterviewStatus, string> = {
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
}

const statusBadgeClassNames: Record<InterviewStatus, string> = {
  IN_PROGRESS: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  COMPLETED: 'border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR')
}

function getInterviewDestination(interview: InterviewSessionListItem) {
  return interview.status === 'IN_PROGRESS' ? `/interviews/${interview.id}` : `/interviews/${interview.id}/feedback`
}

function getApplicationLabel(application: Application) {
  const company = application.jobPosting?.company ?? '회사 정보 없음'
  const title = application.jobPosting?.title ?? '제목 없는 공고'

  return `${company} · ${title}`
}

export default function InterviewPrepPage() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [applicationId, setApplicationId] = useState('')
  const [type, setType] = useState<InterviewType>('TEXT')
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('INTERMEDIATE')
  const [selectedAiModel, setSelectedAiModel] = useState<AiModel>(() => getStoredAiModel())
  const [questionApplicationId, setQuestionApplicationId] = useState('')
  const { data: interviewsResponse, isPending, isError } = useInterviews()
  const { data: applicationsResponse } = useApplications({ limit: 100 })
  const { data: expectedQuestions, isFetching: isFetchingQuestions } = useExpectedInterviewQuestions(questionApplicationId, selectedAiModel)
  const createInterview = useCreateInterview()

  const interviews = useMemo(() => interviewsResponse?.data ?? [], [interviewsResponse])
  const applications = useMemo(() => applicationsResponse?.data ?? [], [applicationsResponse])

  const applicationMap = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications],
  )

  const selfEvaluationTargets = useMemo(
    () => applications.filter((application) => application.status === 'INTERVIEW' || application.status === 'OFFER'),
    [applications],
  )

  useEffect(() => {
    if (!questionApplicationId && applications[0]) {
      setQuestionApplicationId(applications[0].id)
    }
  }, [applications, questionApplicationId])

  const handleCreateInterview = async () => {
    if (!applicationId) {
      return
    }

    const created = await createInterview.mutateAsync({ applicationId, type, difficulty })

    setDialogOpen(false)
    setApplicationId('')
    navigate(`/interviews/${created.id}`)
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.14),transparent_32%),linear-gradient(140deg,theme(colors.muted/0.7),transparent_68%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              면접 준비 허브
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">모의 면접과 실전 회고를 한 번에 관리하세요</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                지원 건별 모의 면접을 시작하고, 종료 후 피드백과 실전 면접 자기 평가를 자연스럽게 이어가세요.
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-5">
                <Plus className="size-4" />
                새 모의 면접
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>새 모의 면접 시작</DialogTitle>
                <DialogDescription>지원 건과 면접 방식을 선택하면 바로 연습을 시작할 수 있습니다.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="interview-application">지원 건</Label>
                  <Select value={applicationId} onValueChange={setApplicationId}>
                    <SelectTrigger id="interview-application" className="w-full">
                      <SelectValue placeholder="면접을 시작할 지원 건을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((application) => (
                        <SelectItem key={application.id} value={application.id}>
                          {getApplicationLabel(application)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="interview-type">면접 유형</Label>
                    <Select value={type} onValueChange={(value) => setType(value as InterviewType)}>
                      <SelectTrigger id="interview-type" className="w-full">
                        <SelectValue placeholder="면접 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interview-difficulty">난이도</Label>
                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as InterviewDifficulty)}>
                      <SelectTrigger id="interview-difficulty" className="w-full">
                        <SelectValue placeholder="난이도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(difficultyLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview-ai-model">AI 모델</Label>
                  <Select
                    value={selectedAiModel}
                    onValueChange={(value) => {
                      setSelectedAiModel(value as AiModel)
                      setStoredAiModel(value as AiModel)
                    }}
                  >
                    <SelectTrigger id="interview-ai-model" className="w-full">
                      <SelectValue placeholder="AI 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary">{option.provider}</span>
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => void handleCreateInterview()}
                  disabled={!applicationId || createInterview.isPending}
                >
                  {createInterview.isPending ? '준비 중...' : '면접 시작'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 md:col-span-2">
          <CardHeader>
            <CardDescription>누적 세션</CardDescription>
            <CardTitle className="text-3xl">{interviews.length}개</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardDescription>진행 중 세션</CardDescription>
            <CardTitle className="text-3xl">{interviews.filter((interview) => interview.status === 'IN_PROGRESS').length}개</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section>
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>예상 질문과 답변 가이드</CardTitle>
                <CardDescription>지원 공고를 바탕으로 면접 전에 확인할 질문과 답변 방향을 정리합니다.</CardDescription>
              </div>
              <div className="w-full lg:w-96">
                <Select value={questionApplicationId} onValueChange={setQuestionApplicationId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="예상 질문을 볼 지원 건 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((application) => (
                      <SelectItem key={application.id} value={application.id}>
                        {getApplicationLabel(application)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!questionApplicationId ? (
              <div className="py-8 text-center text-sm text-muted-foreground">예상 질문을 만들 지원 건이 아직 없습니다.</div>
            ) : null}

            {questionApplicationId && isFetchingQuestions ? (
              <div className="py-8 text-center text-sm text-muted-foreground">예상 질문을 생성하는 중입니다...</div>
            ) : null}

            {questionApplicationId && !isFetchingQuestions && expectedQuestions?.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {expectedQuestions.map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                    <Badge variant="secondary" className="mb-3 rounded-full">Q{index + 1}</Badge>
                    <p className="font-medium leading-6">{item.question}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.guide}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">모의 면접 세션</h2>
            <p className="mt-1 text-sm text-muted-foreground">지원 공고와 연결된 모든 면접 이력을 확인하고 이어서 진행하세요.</p>
          </div>
        </div>

        {isPending ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">면접 세션을 불러오는 중입니다...</CardContent>
          </Card>
        ) : null}

        {!isPending && isError ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">면접 세션을 불러오지 못했습니다.</CardContent>
          </Card>
        ) : null}

        {!isPending && !isError && interviews.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">아직 생성된 모의 면접이 없습니다. 새 면접을 시작해보세요.</CardContent>
          </Card>
        ) : null}

        {!isPending && !isError
          ? interviews.map((interview) => {
              const application = interview.application ?? applicationMap.get(interview.applicationId)
              const company = application?.jobPosting?.company ?? '회사 정보 없음'
              const title = application?.jobPosting?.title ?? '제목 없는 공고'
              const date = interview.endedAt ?? interview.startedAt

              return (
                <Card
                  key={interview.id}
                  className="cursor-pointer gap-4 border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  onClick={() => navigate(getInterviewDestination(interview))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(getInterviewDestination(interview))
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <CardHeader className="gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl leading-snug">{title}</CardTitle>
                        <CardDescription>{company}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 self-start">
                        <Badge variant="outline" className={cn('rounded-full px-3 py-1 font-semibold', statusBadgeClassNames[interview.status])}>
                          {statusLabels[interview.status]}
                        </Badge>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-full">{typeLabels[interview.type]}</Badge>
                      <Badge variant="secondary" className="rounded-full">{difficultyLabels[interview.difficulty]}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4" />
                        <span>{formatDate(date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessagesSquare className="size-4" />
                        <span>{interview.status === 'IN_PROGRESS' ? '대화를 이어서 진행할 수 있습니다' : '피드백 결과를 확인할 수 있습니다'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          : null}
      </section>

      <section>
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>실전 면접 자기 평가</CardTitle>
                <CardDescription>실제 면접 직후 느낌과 개선 포인트를 남겨 다음 준비의 밀도를 높이세요.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              기억이 가장 생생할 때 회고를 남기면 다음 모의 면접 질문과 준비 전략을 더 구체적으로 세울 수 있습니다.
            </div>
            <Separator />
            {selfEvaluationTargets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>회사</TableHead>
                    <TableHead>포지션</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">바로가기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selfEvaluationTargets.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.jobPosting?.company ?? '회사 정보 없음'}</TableCell>
                      <TableCell>{application.jobPosting?.title ?? '제목 없는 공고'}</TableCell>
                      <TableCell>{application.status === 'INTERVIEW' ? '면접 예정/진행' : '최종 결과 단계'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/self-evaluations/new?applicationId=${application.id}`)}>
                          자기 평가 작성
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">자기 평가를 남길 수 있는 지원 건이 아직 없습니다.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
