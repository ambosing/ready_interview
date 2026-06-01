import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import type { AiProvider, AiProviderAuthType, AiProviderConnectionStatus } from '@/lib/ai-models'
import type { ApiResponse } from '@/types'

type SaveAiProviderConnectionInput = {
  provider: AiProvider
  authType: AiProviderAuthType
  apiKey?: string
  accessToken?: string
  oauthJson?: string
}

const aiProviderConnectionKeys = {
  all: ['ai-provider-connections'] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message
  }

  return fallback
}

export function useAiProviderConnections() {
  return useQuery({
    queryKey: aiProviderConnectionKeys.all,
    queryFn: async () => {
      const response = await api.get<ApiResponse<AiProviderConnectionStatus[]>>('/ai/providers')
      return response.data.data
    },
  })
}

export function useSaveAiProviderConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ provider, ...payload }: SaveAiProviderConnectionInput) => {
      const response = await api.put<ApiResponse<AiProviderConnectionStatus[]>>(`/ai/providers/${provider}`, payload)
      return response.data.data
    },
    onSuccess: (statuses) => {
      queryClient.setQueryData(aiProviderConnectionKeys.all, statuses)
      toast.success('AI 공급자 연결이 저장되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'AI 공급자 연결을 저장하지 못했습니다.'))
    },
  })
}

export function useDeleteAiProviderConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (provider: AiProvider) => {
      const response = await api.delete<ApiResponse<AiProviderConnectionStatus[]>>(`/ai/providers/${provider}`)
      return response.data.data
    },
    onSuccess: (statuses) => {
      queryClient.setQueryData(aiProviderConnectionKeys.all, statuses)
      toast.info('AI 공급자 연결을 해제했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'AI 공급자 연결을 해제하지 못했습니다.'))
    },
  })
}
