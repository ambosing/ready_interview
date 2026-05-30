import { LoaderCircle, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { documentKeys, useGenerateDocument } from '@/hooks/use-documents'
import { jobPostingKeys, useAnalyzeJobPosting, useJobPosting } from '@/hooks/use-job-postings'
import { aiModelOptions, getStoredAiModel, setStoredAiModel } from '@/lib/ai-models'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AiModel, DocumentType, JobPostingStatus } from '@/types'

const statusMap: Record<JobPostingStatus, { label: string; className: string }> = {
  DRAFT: { label: '초안', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300' },
  ANALYZED: { label: '분석 완료', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  APPLIED: { label: '지원 완료', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
}

function parseStringArray(value: string | null) {
  if (!value) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export default function JobPostingDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()
  const { data: jobPosting, isLoading } = useJobPosting(id)
  const analyzeJobPosting = useAnalyzeJobPosting(id)
  const generateDocument = useGenerateDocument()
  const [selectedAiModel, setSelectedAiModel] = useState<AiModel>(() => getStoredAiModel())

  const keywords = useMemo(() => parseStringArray(jobPosting?.analyzedKeywords ?? null), [jobPosting?.analyzedKeywords])
  const requirements = useMemo(() => parseStringArray(jobPosting?.analyzedRequirements ?? null), [jobPosting?.analyzedRequirements])

  if (!id) {
    return <div className="text-sm text-muted-foreground">잘못된 접근입니다.</div>
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>
  }

  if (!jobPosting) {
    return <div className="text-sm text-muted-foreground">채용 공고를 찾을 수 없습니다.</div>
  }

  const status = statusMap[jobPosting.status]
  const canGenerateDocument = jobPosting.status !== 'DRAFT' && !generateDocument.isPending

  const handleGenerateDocument = async (type: DocumentType) => {
    if (jobPosting.status === 'DRAFT') {
      toast.error('먼저 채용 공고 분석을 완료해 주세요.')
      return
    }

    const created = await generateDocument.mutateAsync({ type, jobPostingId: id, aiModel: selectedAiModel })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: documentKeys.all }),
      queryClient.invalidateQueries({ queryKey: jobPostingKeys.detail(id) }),
    ])
    toast.success(`${type === 'RESUME' ? '이력서' : '포트폴리오'} 생성이 완료되었습니다.`)
    navigate(`/documents/${created.id}`)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{jobPosting.title}</h1>
          <Badge className={cn('border-0', status.className)}>{status.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>{jobPosting.company || '회사명 미입력'}</span>
          <span>{new Date(jobPosting.createdAt).toLocaleDateString('ko-KR')}</span>
          {jobPosting.url ? (
            <a className="font-medium text-primary underline-offset-4 hover:underline" href={jobPosting.url} target="_blank" rel="noreferrer">
              공고 링크 열기
            </a>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>공고 내용</CardTitle>
            <CardDescription>저장된 원문을 기반으로 분석과 문서 생성을 진행합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-muted/40 p-5 text-sm leading-7 whitespace-pre-wrap text-foreground/90">
              {jobPosting.content}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>AI 분석</CardTitle>
              <CardDescription>공고 핵심 요소를 추출해 맞춤형 서류 생성에 활용합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobPosting.status === 'DRAFT' ? (
                <Button className="w-full rounded-2xl" onClick={() => analyzeJobPosting.mutate({ aiModel: selectedAiModel })} disabled={analyzeJobPosting.isPending}>
                  {analyzeJobPosting.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  공고 분석 시작
                </Button>
              ) : null}

              {jobPosting.status !== 'DRAFT' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-sm font-medium">핵심 키워드</h2>
                    <div className="flex flex-wrap gap-2">
                      {keywords.length > 0 ? (
                        keywords.map((keyword) => <Badge key={keyword} variant="secondary">{keyword}</Badge>)
                      ) : (
                        <p className="text-sm text-muted-foreground">추출된 키워드가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h2 className="text-sm font-medium">주요 요구사항</h2>
                    {requirements.length > 0 ? (
                      <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                        {requirements.map((requirement) => (
                          <li key={requirement} className="rounded-2xl bg-muted/40 px-4 py-3">
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                        분석된 요구사항이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>문서 생성</CardTitle>
              <CardDescription>분석 결과를 바탕으로 맞춤형 문서를 빠르게 생성하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-ai-model">AI 모델</Label>
                <Select
                  value={selectedAiModel}
                  onValueChange={(value) => {
                    setSelectedAiModel(value as AiModel)
                    setStoredAiModel(value as AiModel)
                  }}
                >
                  <SelectTrigger id="document-ai-model" className="w-full">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  disabled={!canGenerateDocument}
                  onClick={() => handleGenerateDocument('RESUME')}
                >
                  이력서 생성
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  disabled={!canGenerateDocument}
                  onClick={() => handleGenerateDocument('PORTFOLIO')}
                >
                  포트폴리오 생성
                </Button>
              </div>

              {jobPosting.status === 'DRAFT' ? (
                <p className="text-sm text-muted-foreground">공고 분석이 완료되면 맞춤형 이력서와 포트폴리오를 생성할 수 있습니다.</p>
              ) : null}

              <Separator />

              <div className="space-y-3">
                <h2 className="text-sm font-medium">연결된 문서</h2>
                {jobPosting.documents.length > 0 ? (
                  <div className="space-y-2">
                    {jobPosting.documents.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                        onClick={() => navigate(`/documents/${document.id}`)}
                      >
                        <div>
                          <p className="font-medium">{document.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {document.type === 'RESUME' ? '이력서' : '포트폴리오'} · {new Date(document.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <Badge variant="outline">열기</Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">연결된 문서가 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
