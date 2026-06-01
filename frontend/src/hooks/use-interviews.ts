import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { getStoredAiModel } from '@/lib/ai-models'
import type {
  AiModel,
  ApiListResponse,
  ApiResponse,
  Application,
  InterviewDifficulty,
  InterviewMessage,
  InterviewSession,
  InterviewType,
} from '@/types'

type CreateInterviewInput = {
  applicationId: string
  type: InterviewType
  difficulty: InterviewDifficulty
}

type SendInterviewMessageInput = {
  id: string
  content: string
  aiModel?: AiModel
}

type InterviewSessionListItem = InterviewSession & {
  application?: Application
}

type InterviewSessionDetail = InterviewSession & {
  messages: InterviewMessage[]
}

type ExpectedInterviewQuestion = {
  question: string
  guide: string
}

type SendInterviewMessageResponse = {
  userMessage: InterviewMessage
  aiMessage: InterviewMessage
}

const interviewKeys = {
  all: ['interviews'] as const,
  lists: () => [...interviewKeys.all, 'list'] as const,
  list: () => [...interviewKeys.lists()] as const,
  questions: (applicationId: string, aiModel?: AiModel) => [...interviewKeys.all, 'questions', applicationId, aiModel] as const,
  details: () => [...interviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...interviewKeys.details(), id] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message
  }

  return fallback
}

export function useInterviews() {
  return useQuery({
    queryKey: interviewKeys.list(),
    queryFn: async () => {
      try {
        const response = await api.get<ApiListResponse<InterviewSessionListItem>>('/interviews')
        return response.data
      } catch (error) {
        toast.error(getErrorMessage(error, '면접 세션 목록을 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<InterviewSessionDetail>>(`/interviews/${id}`)
        return response.data.data
      } catch (error) {
        toast.error(getErrorMessage(error, '면접 세션 정보를 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useCreateInterview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateInterviewInput) => {
      const response = await api.post<ApiResponse<InterviewSession>>('/interviews', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.all })
      toast.success('새 모의 면접이 시작되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '면접 세션 생성에 실패했습니다.'))
    },
  })
}

export function useExpectedInterviewQuestions(applicationId: string, aiModel?: AiModel) {
  return useQuery({
    queryKey: interviewKeys.questions(applicationId, aiModel),
    enabled: Boolean(applicationId),
    queryFn: async () => {
      try {
        const selectedAiModel = aiModel ?? getStoredAiModel()
        const response = await api.post<ApiResponse<ExpectedInterviewQuestion[]>>(
          `/interviews/applications/${applicationId}/questions`,
          {
            aiModel: selectedAiModel,
          },
        )
        return response.data.data
      } catch (error) {
        toast.error(getErrorMessage(error, '예상 질문을 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useSendInterviewMessage(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content, aiModel }: Omit<SendInterviewMessageInput, 'id'>) => {
      const selectedAiModel = aiModel ?? getStoredAiModel()
      const response = await api.post<ApiResponse<SendInterviewMessageResponse>>(`/interviews/${id}/messages`, {
        content,
        aiModel: selectedAiModel,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '메시지 전송에 실패했습니다.'))
    },
  })
}

export function useEndInterview(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { aiModel?: AiModel }) => {
      const aiModel = payload?.aiModel ?? getStoredAiModel()
      const response = await api.post<ApiResponse<InterviewSession>>(`/interviews/${id}/end`, {
        aiModel,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.all })
      queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) })
      toast.success('면접이 종료되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '면접 종료에 실패했습니다.'))
    },
  })
}

export type { ExpectedInterviewQuestion, InterviewSessionDetail, InterviewSessionListItem }
export { interviewKeys }
