import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { getAiProviderConnectionForModel, getStoredAiModel } from '@/lib/ai-models'
import type { AiModel, ApiListResponse, ApiResponse, DocumentType, DocumentVersion, GeneratedDocument } from '@/types'

type DocumentListParams = {
  page?: number
  limit?: number
}

type GenerateDocumentInput = {
  type: DocumentType
  jobPostingId: string
  aiModel?: AiModel
}

type UpdateDocumentInput = {
  id: string
  content: string
}

type DocumentDetail = GeneratedDocument & {
  versions: DocumentVersion[]
}

const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params: DocumentListParams) => [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message
  }

  return fallback
}

export function useDocuments(params: DocumentListParams = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  return useQuery({
    queryKey: documentKeys.list({ page, limit }),
    queryFn: async () => {
      try {
        const response = await api.get<ApiListResponse<GeneratedDocument>>('/documents', {
          params: { page, limit },
        })

        return response.data
      } catch (error) {
        toast.error(getErrorMessage(error, '서류 목록을 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<DocumentDetail>>(`/documents/${id}`)
        return response.data.data
      } catch (error) {
        toast.error(getErrorMessage(error, '서류 정보를 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useGenerateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: GenerateDocumentInput) => {
      const aiModel = payload.aiModel ?? getStoredAiModel()
      const response = await api.post<ApiResponse<GeneratedDocument>>('/documents/generate', {
        ...payload,
        aiModel,
        aiProviderConnection: getAiProviderConnectionForModel(aiModel),
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
      toast.success('서류가 생성되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '서류 생성에 실패했습니다.'))
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content }: UpdateDocumentInput) => {
      const response = await api.put<ApiResponse<GeneratedDocument>>(`/documents/${id}`, { content })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all })
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.id) })
      toast.success('문서가 저장되었습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '문서 저장에 실패했습니다.'))
    },
  })
}

export { documentKeys }
