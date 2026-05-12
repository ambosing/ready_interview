import { LoaderCircle, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

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
import { Textarea } from '@/components/ui/textarea'
import { useApplications, useCreateApplication } from '@/hooks/use-applications'
import { useJobPostings } from '@/hooks/use-job-postings'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus, JobPosting } from '@/types'

type StatusFilter = ApplicationStatus | undefined

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: '전체', value: undefined },
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR')
}

function getNotesPreview(notes: string | null) {
  if (!notes?.trim()) {
    return '아직 메모가 없습니다.'
  }

  return notes
}

function getStatusFilterKey(status: StatusFilter) {
  return status ?? 'ALL'
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(undefined)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedJobPostingId, setSelectedJobPostingId] = useState('')
  const [newApplicationStatus, setNewApplicationStatus] = useState<ApplicationStatus>('APPLIED')
  const [newApplicationNotes, setNewApplicationNotes] = useState('')
  const { data, isPending, isError } = useApplications({ status: selectedStatus, page: 1, limit: 100 })
  const { data: jobPostingsResponse, isPending: isJobPostingPending } = useJobPostings({ page: 1, limit: 100 })
  const createApplication = useCreateApplication()

  const applications = useMemo<Application[]>(() => data?.data ?? [], [data])
  const jobPostings = useMemo<JobPosting[]>(() => jobPostingsResponse?.data ?? [], [jobPostingsResponse])

  const resetCreateForm = () => {
    setSelectedJobPostingId('')
    setNewApplicationStatus('APPLIED')
    setNewApplicationNotes('')
  }

  const handleCreateApplication = async () => {
    if (!selectedJobPostingId) {
      toast.error('지원할 채용 공고를 선택해 주세요.')
      return
    }

    const created = await createApplication.mutateAsync({
      jobPostingId: selectedJobPostingId,
      status: newApplicationStatus,
      notes: newApplicationNotes.trim() || undefined,
    })

    resetCreateForm()
    setIsCreateDialogOpen(false)
    navigate(`/applications/${created.id}`)
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-8 shadow-sm md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.16),transparent_34%),linear-gradient(135deg,theme(colors.muted/0.65),transparent_68%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" />
              지원 파이프라인
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">지원 관리</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                진행 중인 지원을 단계별로 정리하고, 새 지원도 빠르게 등록해 보세요.
              </p>
            </div>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) {
                resetCreateForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <Plus className="size-4" />
                새 지원 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>새 지원 등록</DialogTitle>
                <DialogDescription>지원할 채용 공고와 현재 상태를 선택해 새 지원 기록을 만듭니다.</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="application-job-posting">채용 공고</Label>
                  <Select value={selectedJobPostingId} onValueChange={setSelectedJobPostingId} disabled={isJobPostingPending}>
                    <SelectTrigger id="application-job-posting" className="w-full">
                      <SelectValue placeholder={isJobPostingPending ? '채용 공고를 불러오는 중입니다' : '채용 공고를 선택하세요'} />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPostings.map((jobPosting) => (
                        <SelectItem key={jobPosting.id} value={jobPosting.id}>
                          {jobPosting.company ? `${jobPosting.company} · ${jobPosting.title}` : jobPosting.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="application-status">지원 상태</Label>
                  <Select value={newApplicationStatus} onValueChange={(value) => setNewApplicationStatus(value as ApplicationStatus)}>
                    <SelectTrigger id="application-status" className="w-full">
                      <SelectValue placeholder="지원 상태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusFilters
                        .filter((filter): filter is { label: string; value: ApplicationStatus } => Boolean(filter.value))
                        .map((filter) => (
                          <SelectItem key={filter.value} value={filter.value}>
                            {filter.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="application-notes">메모</Label>
                  <Textarea
                    id="application-notes"
                    className="min-h-28"
                    placeholder="지원 채널, 제출한 서류, 후속 일정 등을 기록해 보세요."
                    value={newApplicationNotes}
                    onChange={(event) => setNewApplicationNotes(event.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateApplication} disabled={createApplication.isPending || isJobPostingPending}>
                  {createApplication.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  등록
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Card className="border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle>상태 필터</CardTitle>
          <CardDescription>원하는 전형 단계만 골라 집중해서 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const isActive = selectedStatus === filter.value

            return (
              <Button
                key={getStatusFilterKey(filter.value)}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setSelectedStatus(filter.value)}
              >
                {filter.label}
              </Button>
            )
          })}
        </CardContent>
      </Card>

      {isPending ? (
        <Card className="border-border/60">
          <CardContent className="flex min-h-48 items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            지원 목록을 불러오는 중입니다.
          </CardContent>
        </Card>
      ) : null}

      {!isPending && isError ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">지원 목록을 불러오지 못했습니다.</CardContent>
        </Card>
      ) : null}

      {!isPending && !isError && applications.length === 0 ? (
        <Card className="border-dashed border-border/70">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">조건에 맞는 지원 내역이 없습니다.</CardContent>
        </Card>
      ) : null}

      {!isPending && !isError && applications.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {applications.map((application) => (
            <Card
              key={application.id}
              className="cursor-pointer overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              onClick={() => navigate(`/applications/${application.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/applications/${application.id}`)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="h-1.5 w-full bg-[linear-gradient(90deg,theme(colors.primary/0.8),theme(colors.primary/0.15),transparent)]" />
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardDescription>{application.jobPosting?.company ?? '회사 정보 없음'}</CardDescription>
                    <CardTitle className="text-xl leading-snug">{application.jobPosting?.title ?? '연결된 공고 없음'}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('rounded-full border px-3 py-1 text-xs font-semibold', statusBadgeClassNames[application.status])}
                  >
                    {statusLabels[application.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                  <p className="line-clamp-3">{getNotesPreview(application.notes)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>지원일 {formatDate(application.appliedAt)}</span>
                  <span className="font-medium text-foreground">상세 보기</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  )
}
