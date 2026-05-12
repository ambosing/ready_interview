import { LoaderCircle, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useDocument, useUpdateDocument } from '@/hooks/use-documents'
import type { DocumentType } from '@/types'

const typeMap: Record<DocumentType, string> = {
  RESUME: '이력서',
  PORTFOLIO: '포트폴리오',
}

export default function DocumentEditorPage() {
  const { id = '' } = useParams()
  const { data: document, isLoading } = useDocument(id)
  const updateDocument = useUpdateDocument()
  const [content, setContent] = useState('')
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)

  useEffect(() => {
    if (!document) {
      return
    }

    setContent(document.content)
    setSelectedVersionId(null)
  }, [document])

  const sortedVersions = useMemo(
    () => [...(document?.versions ?? [])].sort((left, right) => right.versionNumber - left.versionNumber),
    [document?.versions],
  )

  const currentVersionNumber = selectedVersionId
    ? sortedVersions.find((version) => version.id === selectedVersionId)?.versionNumber ?? sortedVersions[0]?.versionNumber ?? 1
    : sortedVersions[0]?.versionNumber ?? 1

  if (!id) {
    return <div className="text-sm text-muted-foreground">잘못된 접근입니다.</div>
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>
  }

  if (!document) {
    return <div className="text-sm text-muted-foreground">문서를 찾을 수 없습니다.</div>
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('문서 내용을 입력한 뒤 저장해 주세요.')
      return
    }

    await updateDocument.mutateAsync({ id, content })
    setSelectedVersionId(null)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
      <Card className="border-border/60">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-3xl tracking-tight">{document.title}</CardTitle>
                <Badge variant="secondary">{typeMap[document.type]}</Badge>
              </div>
              <CardDescription>
                현재 버전 {currentVersionNumber} · 마지막 수정일 {new Date(document.updatedAt).toLocaleDateString('ko-KR')}
              </CardDescription>
            </div>

            <Button onClick={handleSave} disabled={updateDocument.isPending}>
              {updateDocument.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              저장
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[70vh] resize-y rounded-2xl"
            placeholder="생성된 문서를 검토하고 원하는 문장으로 다듬어 보세요."
          />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>버전 히스토리</CardTitle>
          <CardDescription>저장된 버전을 선택해 내용을 불러올 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedVersions.length > 0 ? (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-3">
                {sortedVersions.map((version, index) => {
                  const isSelected = selectedVersionId === version.id || (!selectedVersionId && version.id === sortedVersions[0]?.id)

                  return (
                    <div key={version.id} className="space-y-3">
                      <button
                        type="button"
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'
                        }`}
                        onClick={() => {
                          setSelectedVersionId(version.id)
                          setContent(version.content)
                        }}
                      >
                        <p className="font-medium">버전 {version.versionNumber}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </button>
                      {index < sortedVersions.length - 1 ? <Separator /> : null}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">저장된 버전이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
