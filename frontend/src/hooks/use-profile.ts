import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { getStoredAiModel } from '@/lib/ai-models'
import type { AiModel, ApiResponse, Career, Certification, Education, Profile, Project, Skill, SwotAnalysis } from '@/types'

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

export type ResumeImportSummary = {
  source: {
    fileName: string
    extractedCharacters: number
  }
  basicInfoUpdated: string[]
  educationsCreated: number
  careersCreated: number
  certificationsCreated: number
  projectsCreated: number
  skillsCreated: number
  swotUpdated: boolean
  duplicatesSkipped: number
}

export type ResumeImportResult = {
  profile: ProfileDetail
  imported: ResumeImportSummary
}

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

function formatImportSummary(imported: ResumeImportSummary) {
  const counts = [
    imported.educationsCreated > 0 ? `학력 ${imported.educationsCreated}개` : null,
    imported.careersCreated > 0 ? `경력 ${imported.careersCreated}개` : null,
    imported.certificationsCreated > 0 ? `자격증 ${imported.certificationsCreated}개` : null,
    imported.projectsCreated > 0 ? `프로젝트 ${imported.projectsCreated}개` : null,
    imported.skillsCreated > 0 ? `기술 ${imported.skillsCreated}개` : null,
    imported.basicInfoUpdated.length > 0 ? `기본 정보 ${imported.basicInfoUpdated.length}개` : null,
    imported.swotUpdated ? 'SWOT' : null,
  ].filter(Boolean)

  return counts.length > 0 ? `${counts.join(', ')}를 반영했습니다.` : '새로 반영할 프로필 항목을 찾지 못했습니다.'
}

export function useImportResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, aiModel }: { file: File; aiModel?: AiModel }) => {
      const selectedAiModel = aiModel ?? getStoredAiModel()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('aiModel', selectedAiModel)

      const response = await api.post<ApiResponse<ResumeImportResult>>('/profile/import-resume', formData)
      return response.data.data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      toast.success(formatImportSummary(result.imported))
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '이력서 프로필 반영에 실패했습니다.'))
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
