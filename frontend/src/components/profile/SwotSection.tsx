import { useEffect, useState, type ComponentProps } from 'react'
import { Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateSwot } from '@/hooks/use-profile'
import type { SwotAnalysis } from '@/types'

type SwotSectionProps = {
  swotAnalysis: SwotAnalysis | null
}

type FormState = {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}

const quadrantMeta: Array<{ key: keyof FormState; title: string; description: string }> = [
  { key: 'strengths', title: '강점', description: '지원 경쟁력을 높이는 내적 자산' },
  { key: 'weaknesses', title: '약점', description: '보완이 필요한 요소와 리스크' },
  { key: 'opportunities', title: '기회', description: '시장·직무 관점에서의 외부 기회' },
  { key: 'threats', title: '위협', description: '준비 과정에서 고려해야 할 외부 변수' },
]

function joinLines(values: string[] | undefined) {
  return values?.join('\n') ?? ''
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function createFormState(swotAnalysis: SwotAnalysis | null): FormState {
  return {
    strengths: joinLines(swotAnalysis?.strengths),
    weaknesses: joinLines(swotAnalysis?.weaknesses),
    opportunities: joinLines(swotAnalysis?.opportunities),
    threats: joinLines(swotAnalysis?.threats),
  }
}

export function SwotSection({ swotAnalysis }: SwotSectionProps) {
  const updateSwot = useUpdateSwot()
  const [form, setForm] = useState<FormState>(() => createFormState(swotAnalysis))

  useEffect(() => {
    setForm(createFormState(swotAnalysis))
  }, [swotAnalysis])

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()

    await updateSwot.mutateAsync({
      strengths: splitLines(form.strengths),
      weaknesses: splitLines(form.weaknesses),
      opportunities: splitLines(form.opportunities),
      threats: splitLines(form.threats),
    })
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>SWOT 분석</CardTitle>
        <CardDescription>각 항목을 한 줄씩 입력하면 전략적으로 정리할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {quadrantMeta.map((quadrant, index) => (
              <div
                key={quadrant.key}
                className="rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top_left,theme(colors.primary/0.08),transparent_40%)] p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Target className="size-4" />
                  </div>
                  <div>
                    <Label htmlFor={`swot-${quadrant.key}`} className="text-base font-semibold">{quadrant.title}</Label>
                    <p className="text-xs text-muted-foreground">{quadrant.description}</p>
                  </div>
                </div>
                <Textarea
                  id={`swot-${quadrant.key}`}
                  className="min-h-40"
                  placeholder={`${quadrant.title} 항목을 한 줄씩 입력해 주세요.`}
                  value={form[quadrant.key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [quadrant.key]: event.target.value,
                    }))
                  }
                />
                <p className="mt-3 text-xs text-muted-foreground">{index < 2 ? '내부 요인 중심으로 정리해 주세요.' : '외부 환경 변화에 맞춰 정리해 주세요.'}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSwot.isPending}>
              {updateSwot.isPending ? '저장 중...' : 'SWOT 저장'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default SwotSection
