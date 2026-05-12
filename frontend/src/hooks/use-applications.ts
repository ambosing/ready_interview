import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import type {
  ApiListResponse,
  ApiResponse,
  Application,
  ApplicationStatus,
  InterviewSession,
  JobPosting,
  SelfEvaluation,
} from '@/types'

type ApplicationListParams = {
  page?: number
  limit?: number
  status?: ApplicationStatus
}

type CreateApplicationInput = {
  jobPostingId: string
  status: ApplicationStatus
  notes?: string
}

type UpdateApplicationInput = {
  id: string
  status?: ApplicationStatus
  notes?: string
}

type ApplicationDetail = Application & {
  jobPosting: JobPosting
  interviews: InterviewSession[]
  evaluations: SelfEvaluation[]
}

const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (params: ApplicationListParams) => [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message
  }

  return fallback
}

export function useApplications(params: ApplicationListParams = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  return useQuery({
    queryKey: applicationKeys.list({ page, limit, status: params.status }),
    queryFn: async () => {
      try {
        const response = await api.get<ApiListResponse<Application>>('/applications', {
          params: { page, limit, status: params.status },
        })

        return response.data
      } catch (error) {
        toast.error(getErrorMessage(error, '지원 목록을 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<ApplicationDetail>>(`/applications/${id}`)
        return response.data.data
      } catch (error) {
        toast.error(getErrorMessage(error, '지원 상세 정보를 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateApplicationInput) => {
      const response = await api.post<ApiResponse<Application>>('/applications', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      toast.success('지원 정보가 등록되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '지원 등록에 실패했습니다.'))
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateApplicationInput) => {
      const response = await api.put<ApiResponse<Application>>(`/applications/${id}`, payload)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all })
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) })
      toast.success('지원 정보가 업데이트되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '지원 정보 업데이트에 실패했습니다.'))
    },
  })
}

export type { ApplicationDetail }
export { applicationKeys }
