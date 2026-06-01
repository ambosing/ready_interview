import { useRef, useState, type ComponentProps } from 'react'
import { FileUp, LoaderCircle, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { aiModelOptions, getStoredAiModel } from '@/lib/ai-models'
import { useImportResume, type ResumeImportSummary } from '@/hooks/use-profile'
import type { AiModel } from '@/types'

const acceptedResumeTypes = '.pdf,.docx,.txt,.md,.markdown,.json'

function summaryItems(summary: ResumeImportSummary) {
  return [
    summary.basicInfoUpdated.length > 0 ? `기본 정보 ${summary.basicInfoUpdated.length}` : null,
    summary.educationsCreated > 0 ? `학력 ${summary.educationsCreated}` : null,
    summary.careersCreated > 0 ? `경력 ${summary.careersCreated}` : null,
    summary.certificationsCreated > 0 ? `자격증 ${summary.certificationsCreated}` : null,
    summary.projectsCreated > 0 ? `프로젝트 ${summary.projectsCreated}` : null,
    summary.skillsCreated > 0 ? `기술 ${summary.skillsCreated}` : null,
    summary.swotUpdated ? 'SWOT' : null,
  ].filter(Boolean)
}

export function ResumeImportSection() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const importResume = useImportResume()
  const [file, setFile] = useState<File | null>(null)
  const [aiModel, setAiModel] = useState<AiModel>(() => getStoredAiModel())
  const [lastImport, setLastImport] = useState<ResumeImportSummary | null>(null)

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault()
    if (!file) return

    const result = await importResume.mutateAsync({ file, aiModel })
    setLastImport(result.imported)
    setFile(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const items = lastImport ? summaryItems(lastImport) : []

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>이력서 자동 입력</CardTitle>
          <CardDescription>기존 이력서에서 프로필 항목을 추출합니다.</CardDescription>
        </div>
        <FileUp className="size-9 text-primary" />
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(15rem,0.75fr)_auto]" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="resume-import-file">이력서 파일</Label>
            <Input
              ref={inputRef}
              id="resume-import-file"
              type="file"
              accept={acceptedResumeTypes}
              onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-import-ai-model">AI 모델</Label>
            <Select value={aiModel} onValueChange={(value) => setAiModel(value as AiModel)}>
              <SelectTrigger id="resume-import-ai-model" className="w-full">
                <SelectValue placeholder="AI 모델 선택" />
              </SelectTrigger>
              <SelectContent>
                {aiModelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="text-xs font-medium text-primary">{option.provider}</span>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full gap-2 lg:w-auto" disabled={!file || importResume.isPending}>
              {importResume.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              반영
            </Button>
          </div>
        </form>

        {lastImport ? (
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium">{lastImport.source.fileName}</p>
            <p className="mt-1 text-muted-foreground">
              {items.length > 0 ? `${items.join(', ')} 반영` : '새로 반영된 항목 없음'}
              {lastImport.duplicatesSkipped > 0 ? ` · 중복 ${lastImport.duplicatesSkipped}개 건너뜀` : ''}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default ResumeImportSection
