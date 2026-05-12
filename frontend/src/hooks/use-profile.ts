import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import type { ApiResponse, Career, Certification, Education, Profile, Project, Skill, SwotAnalysis } from '@/types'

export type ProfileDetail = Profile & {
  educations: Education[]
  careers: Career[]
  certifications: Certification[]
  projects: Project[]
  skills: Skill[]
  swotAnalysis: SwotAnalysis | null
}

export type UpdateProfileInput = {
  phone: string | null
  address: string | null
  bio: string | null
}

export type CreateEducationInput = Omit<Education, 'id' | 'profileId'>
export type UpdateEducationInput = CreateEducationInput & { id: string }

export type CreateCareerInput = Omit<Career, 'id' | 'profileId'>
export type UpdateCareerInput = CreateCareerInput & { id: string }

export type CreateCertificationInput = Omit<Certification, 'id' | 'profileId'>
export type UpdateCertificationInput = CreateCertificationInput & { id: string }

export type CreateProjectInput = Omit<Project, 'id' | 'profileId'>
export type UpdateProjectInput = CreateProjectInput & { id: string }

export type CreateSkillInput = Omit<Skill, 'id' | 'profileId'>
export type UpdateSkillInput = CreateSkillInput & { id: string }

export type UpdateSwotInput = Pick<SwotAnalysis, 'strengths' | 'weaknesses' | 'opportunities' | 'threats'>

type ResourceName = 'educations' | 'careers' | 'certifications' | 'projects' | 'skills' | 'swot'

const profileKeys = {
  all: ['profile'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (resource: ResourceName) => [...profileKeys.lists(), resource] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: () => [...profileKeys.details(), 'me'] as const,
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message
  }

  return fallback
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<ProfileDetail>>('/profile')
        return response.data.data
      } catch (error) {
        toast.error(getErrorMessage(error, '프로필 정보를 불러오지 못했습니다.'))
        throw error
      }
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateProfileInput) => {
      const response = await api.put<ApiResponse<Profile>>('/profile', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      toast.success('기본 정보를 저장했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '기본 정보 저장에 실패했습니다.'))
    },
  })
}

export function useCreateEducation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateEducationInput) => {
      const response = await api.post<ApiResponse<Education>>('/educations', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('educations') })
      toast.success('학력 정보를 추가했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '학력 정보 추가에 실패했습니다.'))
    },
  })
}

export function useUpdateEducation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateEducationInput) => {
      const response = await api.put<ApiResponse<Education>>(`/educations/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('educations') })
      toast.success('학력 정보를 수정했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '학력 정보 수정에 실패했습니다.'))
    },
  })
}

export function useDeleteEducation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiResponse<null>>(`/educations/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('educations') })
      toast.success('학력 정보를 삭제했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '학력 정보 삭제에 실패했습니다.'))
    },
  })
}

export function useCreateCareer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCareerInput) => {
      const response = await api.post<ApiResponse<Career>>('/careers', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('careers') })
      toast.success('경력 정보를 추가했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '경력 정보 추가에 실패했습니다.'))
    },
  })
}

export function useUpdateCareer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCareerInput) => {
      const response = await api.put<ApiResponse<Career>>(`/careers/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('careers') })
      toast.success('경력 정보를 수정했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '경력 정보 수정에 실패했습니다.'))
    },
  })
}

export function useDeleteCareer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiResponse<null>>(`/careers/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('careers') })
      toast.success('경력 정보를 삭제했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '경력 정보 삭제에 실패했습니다.'))
    },
  })
}

export function useCreateCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCertificationInput) => {
      const response = await api.post<ApiResponse<Certification>>('/certifications', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('certifications') })
      toast.success('자격증 정보를 추가했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '자격증 정보 추가에 실패했습니다.'))
    },
  })
}

export function useUpdateCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCertificationInput) => {
      const response = await api.put<ApiResponse<Certification>>(`/certifications/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('certifications') })
      toast.success('자격증 정보를 수정했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '자격증 정보 수정에 실패했습니다.'))
    },
  })
}

export function useDeleteCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiResponse<null>>(`/certifications/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('certifications') })
      toast.success('자격증 정보를 삭제했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '자격증 정보 삭제에 실패했습니다.'))
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateProjectInput) => {
      const response = await api.post<ApiResponse<Project>>('/projects', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('projects') })
      toast.success('프로젝트 정보를 추가했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '프로젝트 정보 추가에 실패했습니다.'))
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateProjectInput) => {
      const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('projects') })
      toast.success('프로젝트 정보를 수정했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '프로젝트 정보 수정에 실패했습니다.'))
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiResponse<null>>(`/projects/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('projects') })
      toast.success('프로젝트 정보를 삭제했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '프로젝트 정보 삭제에 실패했습니다.'))
    },
  })
}

export function useCreateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSkillInput) => {
      const response = await api.post<ApiResponse<Skill>>('/skills', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('skills') })
      toast.success('보유 기술을 추가했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '보유 기술 추가에 실패했습니다.'))
    },
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateSkillInput) => {
      const response = await api.put<ApiResponse<Skill>>(`/skills/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('skills') })
      toast.success('보유 기술을 수정했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '보유 기술 수정에 실패했습니다.'))
    },
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiResponse<null>>(`/skills/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('skills') })
      toast.success('보유 기술을 삭제했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '보유 기술 삭제에 실패했습니다.'))
    },
  })
}

export function useUpdateSwot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateSwotInput) => {
      const response = await api.put<ApiResponse<SwotAnalysis>>('/swot', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      queryClient.invalidateQueries({ queryKey: profileKeys.list('swot') })
      toast.success('SWOT 분석을 저장했습니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'SWOT 분석 저장에 실패했습니다.'))
    },
  })
}

export { getErrorMessage, profileKeys }
