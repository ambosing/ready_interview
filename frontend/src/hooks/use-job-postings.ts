import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { getStoredAiModel } from '@/lib/ai-models'
import type { AiModel, ApiListResponse, ApiResponse, GeneratedDocument, JobPosting } from '@/types'

type JobPostingListParams = {
  page?: number
  limit?: number
}

type CreateJobPostingInput = {
  title: string
  company?: string
  url?: string
  content: string
}

type JobPostingDetail = JobPosting & {
  documents: GeneratedDocument[]
}

type AnalyzeJobPostingInput = {
  aiModel?: AiModel
}

const jobPostingKeys = {
  all: ['job-postings'] as const,
  lists: () => [...jobPostingKeys.all, 'list'] as const,
  list: (params: JobPostingListParams) => [...jobPostingKeys.lists(), params] as const,
  details: () => [...jobPostingKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobPostingKeys.details(), id] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message
  }

  return fallback
}

export function useJobPostings(params: JobPostingListParams = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  return useQuery({
    queryKey: jobPostingKeys.list({ page, limit }),
    queryFn: async () => {
      try {
        const response = await api.get<ApiListResponse<JobPosting>>('/job-postings', {
          params: { page, limit },
        })

        return response.data
      } catch (error) {
        toast.error(getErrorMessage(error, '채용 공고 목록을 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useJobPosting(id: string) {
  return useQuery({
    queryKey: jobPostingKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<JobPostingDetail>>(`/job-postings/${id}`)
        return response.data.data
      } catch (error) {
        toast.error(getErrorMessage(error, '채용 공고 정보를 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateJobPostingInput) => {
      const response = await api.post<ApiResponse<JobPosting>>('/job-postings', payload)
      return response.data.data
    },
    onSuccess: (jobPosting) => {
      queryClient.invalidateQueries({ queryKey: jobPostingKeys.all })
      toast.success('채용 공고가 등록되었습니다.')
      return jobPosting
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '채용 공고 등록에 실패했습니다.'))
    },
  })
}

export function useAnalyzeJobPosting(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: AnalyzeJobPostingInput) => {
      const aiModel = payload?.aiModel ?? getStoredAiModel()
      const response = await api.post<ApiResponse<JobPosting>>(`/job-postings/${id}/analyze`, {
        aiModel,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobPostingKeys.all })
      toast.success('채용 공고 분석이 완료되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '채용 공고 분석에 실패했습니다.'))
    },
  })
}

export { jobPostingKeys }
