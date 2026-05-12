import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useApplications } from '@/hooks/use-applications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { ApiResponse, SelfEvaluation } from '@/types'

const performanceOptions = Array.from({ length: 10 }, (_, index) => {
  const value = String(index + 1)

  return {
    value,
    label: `${value}점`,
  }
})

export default function SelfEvaluationPage() {
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  const initialApplicationId = searchParams.get('applicationId') ?? ''
  const [applicationId, setApplicationId] = useState(initialApplicationId)
  const [performance, setPerformance] = useState('7')
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  const [questionsAsked, setQuestionsAsked] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: applicationsResponse } = useApplications({ limit: 100 })

  const applications = useMemo(() => applicationsResponse?.data ?? [], [applicationsResponse])
  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === applicationId),
    [applicationId, applications],
  )

  const handleSubmit = async () => {
    if (!applicationId) {
      toast.error('지원 건을 선택해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      await api.post<ApiResponse<SelfEvaluation>>('/self-evaluations', {
        applicationId,
        performance: Number(performance),
        strengths,
        improvements,
        questionsAsked,
        notes,
      })

      toast.success('자기 평가가 저장되었습니다.')
      navigate('/interviews')
    } catch {
      toast.error('자기 평가 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.12),transparent_32%),linear-gradient(145deg,theme(colors.muted/0.72),transparent_72%)]" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            실전 면접 회고
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">실제 면접 직후의 감각을 기록하세요</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              좋았던 답변과 아쉬웠던 순간을 남기면 다음 모의 면접과 준비 전략을 훨씬 선명하게 다듬을 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <CardTitle>자기 평가 작성</CardTitle>
            <CardDescription>면접 직후 떠오르는 생각을 가능한 구체적으로 남겨주세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="self-evaluation-application">지원 건</Label>
              <Select value={applicationId} onValueChange={setApplicationId}>
                <SelectTrigger id="self-evaluation-application" className="w-full">
                  <SelectValue placeholder="회고를 남길 지원 건을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {(application.jobPosting?.company ?? '회사 정보 없음') + ' · ' + (application.jobPosting?.title ?? '제목 없는 공고')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="self-evaluation-performance">체감 수행 점수</Label>
              <Select value={performance} onValueChange={setPerformance}>
                <SelectTrigger id="self-evaluation-performance" className="w-full">
                  <SelectValue placeholder="1점부터 10점까지 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {performanceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="self-evaluation-strengths">잘한 점</Label>
              <Textarea
                id="self-evaluation-strengths"
                className="min-h-28"
                placeholder="답변에서 좋았던 표현, 준비가 잘 통했던 순간을 적어주세요"
                value={strengths}
                onChange={(event) => setStrengths(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="self-evaluation-improvements">개선할 점</Label>
              <Textarea
                id="self-evaluation-improvements"
                className="min-h-28"
                placeholder="막혔던 질문, 부족했던 근거, 더 보완할 포인트를 정리하세요"
                value={improvements}
                onChange={(event) => setImprovements(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="self-evaluation-questions">직접 질문한 내용</Label>
              <Textarea
                id="self-evaluation-questions"
                className="min-h-24"
                placeholder="면접관에게 물어본 질문과 반응을 남겨보세요"
                value={questionsAsked}
                onChange={(event) => setQuestionsAsked(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="self-evaluation-notes">추가 메모</Label>
              <Textarea
                id="self-evaluation-notes"
                className="min-h-32"
                placeholder="분위기, 예상 밖 질문, 다음 준비 아이디어 등 자유롭게 기록하세요"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/interviews')} disabled={isSubmitting}>
                취소
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={isSubmitting || !applicationId}>
                {isSubmitting ? '저장 중...' : '자기 평가 저장'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <CardTitle>현재 선택한 지원 건</CardTitle>
            <CardDescription>어떤 면접에 대한 회고인지 맥락을 함께 남겨보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {selectedApplication ? (
              <>
                <div className="space-y-1">
                  <p className="text-muted-foreground">회사</p>
                  <p className="font-medium">{selectedApplication.jobPosting?.company ?? '회사 정보 없음'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">포지션</p>
                  <p className="font-medium">{selectedApplication.jobPosting?.title ?? '제목 없는 공고'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">지원 상태</p>
                  <p className="font-medium">{selectedApplication.status}</p>
                </div>
              </>
            ) : (
              <p className="leading-6 text-muted-foreground">지원 건을 선택하면 해당 회사와 포지션 정보를 여기에서 확인할 수 있습니다.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
