import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateJobPosting } from '@/hooks/use-job-postings'

type FormValues = {
  title: string
  company: string
  url: string
  content: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  title: '',
  company: '',
  url: '',
  content: '',
}

function validate(values: FormValues) {
  const errors: FormErrors = {}

  if (!values.title.trim()) {
    errors.title = '채용 공고 제목을 입력해 주세요.'
  }

  if (!values.content.trim()) {
    errors.content = '채용 공고 원문을 붙여 넣어 주세요.'
  } else if (values.content.trim().length < 200) {
    errors.content = '공고 내용은 200자 이상 입력해 주세요.'
  }

  return errors
}

export default function JobPostingNewPage() {
  const navigate = useNavigate()
  const createJobPosting = useCreateJobPosting()
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0] ?? '입력한 내용을 확인해 주세요.')
      return
    }

    const result = await createJobPosting.mutateAsync({
      title: values.title.trim(),
      company: values.company.trim() || undefined,
      url: values.url.trim() || undefined,
      content: values.content.trim(),
    })

    navigate(`/job-postings/${result.id}`)
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.14),transparent_32%),linear-gradient(135deg,theme(colors.muted/0.7),transparent_65%)]" />
        <div className="relative space-y-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">새 채용 공고 등록</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              링크 또는 공고 원문을 저장하고, 분석과 서류 생성을 바로 이어가세요.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-border/60">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>공고 정보 입력</CardTitle>
            <CardDescription>핵심 정보와 원문 내용을 함께 저장해 두세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">채용 공고 제목</Label>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => handleChange('title', event.target.value)}
                aria-invalid={Boolean(errors.title)}
                placeholder="예: AI 서비스 기획자"
              />
              {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">회사명</Label>
                <Input
                  id="company"
                  value={values.company}
                  onChange={(event) => handleChange('company', event.target.value)}
                  placeholder="예: 하이어리"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">공고 링크</Label>
                <Input
                  id="url"
                  type="url"
                  value={values.url}
                  onChange={(event) => handleChange('url', event.target.value)}
                  placeholder="https://company.com/careers/ai-pm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">공고 원문</Label>
              <Textarea
                id="content"
                value={values.content}
                onChange={(event) => handleChange('content', event.target.value)}
                aria-invalid={Boolean(errors.content)}
                className="min-h-72 resize-y"
                placeholder="채용 공고 전문을 그대로 붙여 넣어 주세요. 역할, 자격 요건, 우대 사항까지 포함하면 분석 정확도가 높아집니다."
              />
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{errors.content ?? '필수 항목입니다. 최소 200자 이상 입력해 주세요.'}</span>
                <span>{values.content.trim().length}자</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button type="submit" disabled={createJobPosting.isPending}>
              {createJobPosting.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              등록하기
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
