import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, CornerDownLeft, Hourglass, Send, User } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { useEndInterview, useInterview, useSendInterviewMessage } from '@/hooks/use-interviews'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { InterviewDifficulty, InterviewMessage, InterviewType } from '@/types'

const typeLabels: Record<InterviewType, string> = {
  TEXT: '텍스트',
  VOICE: '음성',
}

const difficultyLabels: Record<InterviewDifficulty, string> = {
  BASIC: '기초',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('ko-KR')
}

function MessageBubble({ message }: { message: InterviewMessage }) {
  const isUser = message.role === 'USER'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[85%] items-start gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-2xl border', isUser ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border/60 bg-muted text-muted-foreground')}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </div>
        <div className={cn('rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm', isUser ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border border-border/60 bg-card text-foreground')}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <p className={cn('mt-2 text-[11px]', isUser ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {formatDateTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MockInterviewPage() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const { data: interview, isPending, isError } = useInterview(id)
  const sendMessage = useSendInterviewMessage(id)
  const endInterview = useEndInterview(id)

  const messages = useMemo(() => interview?.messages ?? [], [interview?.messages])

  useEffect(() => {
    if (interview?.status === 'COMPLETED') {
      navigate(`/interviews/${interview.id}/feedback`, { replace: true })
    }
  }, [interview?.id, interview?.status, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    const trimmed = content.trim()

    if (!trimmed) {
      return
    }

    await sendMessage.mutateAsync({ content: trimmed })
    setContent('')
  }

  const handleEndInterview = async () => {
    const endedInterview = await endInterview.mutateAsync()
    navigate(`/interviews/${endedInterview.id}/feedback`)
  }

  if (isPending) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">면접 세션을 불러오는 중입니다...</CardContent>
      </Card>
    )
  }

  if (isError || !interview) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">면접 세션을 불러오지 못했습니다.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.15),transparent_32%),linear-gradient(145deg,theme(colors.muted/0.72),transparent_72%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Hourglass className="size-3.5 text-primary" />
              실전 감각 모의 면접
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{interview.type === 'TEXT' ? '텍스트' : '음성'} 모의 면접</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                답변의 논리 흐름과 표현 밀도를 의식하며, 실제 면접처럼 차분하게 이어가보세요.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">{typeLabels[interview.type]}</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{difficultyLabels[interview.difficulty]}</Badge>
            <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-100 px-3 py-1 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              진행중
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <CardTitle>면접 대화</CardTitle>
            <CardDescription>질문 의도를 먼저 파악한 뒤, 경험과 근거를 짧고 선명하게 연결해보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[56vh] rounded-3xl border border-border/60 bg-muted/15 p-4">
              <div className="space-y-4 pr-3">
                {messages.length > 0 ? (
                  messages.map((message) => <MessageBubble key={message.id} message={message} />)
                ) : (
                  <div className="flex h-[40vh] items-center justify-center text-center text-sm text-muted-foreground">
                    첫 답변을 보내면 면접 대화가 시작됩니다.
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSend()
              }}
            >
              <Input
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="답변을 입력하세요"
                disabled={sendMessage.isPending || endInterview.isPending}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={!content.trim() || sendMessage.isPending || endInterview.isPending}>
                  <Send className="size-4" />
                  전송
                </Button>
                <Button type="button" variant="outline" disabled={endInterview.isPending || sendMessage.isPending} onClick={() => void handleEndInterview()}>
                  <CornerDownLeft className="size-4" />
                  면접 종료
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle>세션 정보</CardTitle>
              <CardDescription>현재 면접의 설정과 진행 상황입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">시작일</p>
                <p className="font-medium">{formatDateTime(interview.startedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">누적 메시지</p>
                <p className="font-medium">{messages.length}개</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">면접 팁</p>
                <p className="leading-6 text-muted-foreground">질문을 반복 요약한 뒤 핵심 경험, 수치, 배운 점 순서로 답하면 전달력이 좋아집니다.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <CardTitle>마무리 안내</CardTitle>
              <CardDescription>면접 종료 후 즉시 AI 피드백 화면으로 이동합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => {
                toast('답변이 충분히 쌓였다면 면접 종료 후 피드백을 확인하세요.')
              }}>
                피드백 흐름 안내 보기
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
