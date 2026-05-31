import { useMemo } from 'react'
import { Award, ChartColumnIncreasing, CircleCheckBig, RefreshCcw } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { useInterview } from '@/hooks/use-interviews'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

type FeedbackCategory = {
  name: string
  score: number
  comment?: string
  feedback?: string
}

type InterviewFeedback = {
  overallScore: number
  categories: FeedbackCategory[]
  summary: string
  improvements: string[] | string
}

function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.score === 'number' &&
    (typeof candidate.comment === 'string' || typeof candidate.feedback === 'string')
  )
}

function normalizeFeedback(parsed: Record<string, unknown>): InterviewFeedback | null {
  if (
    typeof parsed.overallScore !== 'number' ||
    !Array.isArray(parsed.categories) ||
    !parsed.categories.every(isFeedbackCategory) ||
    typeof parsed.summary !== 'string' ||
    !(typeof parsed.improvements === 'string' || Array.isArray(parsed.improvements))
  ) {
    return null
  }

  return {
    overallScore: parsed.overallScore,
    categories: parsed.categories.map((category) => ({
      name: category.name,
      score: category.score,
      comment: category.comment || category.feedback || '',
    })),
    summary: parsed.summary,
    improvements: parsed.improvements as string[] | string,
  }
}

function parseFeedback(value: InterviewFeedback | string | null): InterviewFeedback | null {
  if (!value) {
    return null
  }

  if (typeof value === 'object') {
    return normalizeFeedback(value as unknown as Record<string, unknown>)
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return normalizeFeedback(parsed)
  } catch {
    return null
  }
}

function formatImprovementList(value: string[] | string) {
  return Array.isArray(value) ? value : value.split(/\n|•/).map((item) => item.trim()).filter(Boolean)
}

export default function InterviewFeedbackPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { data: interview, isPending, isError } = useInterview(id)

  const feedback = useMemo(() => parseFeedback(interview?.feedback ?? null), [interview?.feedback])
  const improvements = useMemo(() => (feedback ? formatImprovementList(feedback.improvements) : []), [feedback])

  if (isPending) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">면접 피드백을 불러오는 중입니다...</CardContent>
      </Card>
    )
  }

  if (isError || !interview) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">면접 피드백을 불러오지 못했습니다.</CardContent>
      </Card>
    )
  }

  if (interview.status !== 'COMPLETED') {
    return (
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">아직 면접이 종료되지 않았습니다. 진행 화면으로 돌아가 면접을 마무리해주세요.</p>
          <Button onClick={() => navigate(`/interviews/${interview.id}`)}>면접으로 돌아가기</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.green.500/0.16),transparent_34%),linear-gradient(145deg,theme(colors.muted/0.72),transparent_72%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <CircleCheckBig className="size-3.5 text-green-600" />
              면접 피드백 리포트
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">이번 면접의 강점과 개선 포인트를 정리했어요</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                점수만 확인하지 말고, 카테고리별 코멘트와 개선 제안을 다음 연습 계획으로 바로 연결해보세요.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/interviews')}>
              목록으로 이동
            </Button>
            <Button onClick={() => navigate(`/interviews/${interview.id}`)}>
              <RefreshCcw className="size-4" />
              다시 연습하기
            </Button>
          </div>
        </div>
      </section>

      {feedback ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="border-border/60">
              <CardHeader>
                <CardDescription>종합 점수</CardDescription>
                <CardTitle className="flex items-end gap-2 text-5xl font-semibold tracking-tight">
                  {feedback.overallScore}
                  <span className="pb-1 text-base text-muted-foreground">/ 100</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="size-4 text-primary" />
                  전반적인 답변 완성도와 설득력을 기준으로 산정되었습니다.
                </div>
                <Badge className="rounded-full bg-green-600 px-3 py-1 text-white hover:bg-green-600">피드백 완료</Badge>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="space-y-2">
                <CardTitle>종합 요약</CardTitle>
                <CardDescription>면접 전체 흐름을 바탕으로 AI가 정리한 핵심 코멘트입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{feedback.summary}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-border/60">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <ChartColumnIncreasing className="size-5 text-primary" />
                  카테고리별 점수
                </CardTitle>
                <CardDescription>세부 항목별 강약을 확인하고 보완 우선순위를 잡아보세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {feedback.categories.map((category, index) => (
                  <div key={`${category.name}-${index}`} className="space-y-3 rounded-2xl border border-border/60 bg-muted/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.score}점</p>
                    </div>
                    <Progress value={category.score} />
                    <p className="text-sm leading-6 text-muted-foreground">{category.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="space-y-2">
                <CardTitle>다음 면접을 위한 개선 제안</CardTitle>
                <CardDescription>바로 실행 가능한 항목부터 작은 루틴으로 반영해보세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvements.length > 0 ? (
                  improvements.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                      <p className="text-sm leading-6">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">표시할 개선 제안이 없습니다.</p>
                )}
                <Separator />
                <Button className="w-full" variant="outline" onClick={() => navigate('/interviews')}>
                  다른 세션도 확인하기
                </Button>
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">피드백 데이터가 아직 준비되지 않았습니다.</CardContent>
        </Card>
      )}
    </div>
  )
}
