export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
  profile?: Profile | null
}

export interface Profile {
  id: string
  userId: string
  phone: string | null
  address: string | null
  bio: string | null
  profileImageUrl: string | null
  completeness: number
  createdAt: string
  updatedAt: string
}

export interface Education {
  id: string
  profileId: string
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string | null
  description: string | null
}

export interface Career {
  id: string
  profileId: string
  company: string
  position: string
  department: string | null
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string | null
}

export interface Certification {
  id: string
  profileId: string
  name: string
  issuer: string
  issueDate: string
  expiryDate: string | null
  credentialId: string | null
}

export interface Project {
  id: string
  profileId: string
  name: string
  description: string
  role: string
  techStack: string[]
  startDate: string
  endDate: string | null
  achievements: string | null
  url: string | null
}

export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export interface Skill {
  id: string
  profileId: string
  name: string
  category: string | null
  proficiency: Proficiency
}

export interface SwotAnalysis {
  id: string
  profileId: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export type JobPostingStatus = 'DRAFT' | 'ANALYZED' | 'APPLIED'
export type DocumentType = 'RESUME' | 'PORTFOLIO'
export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'
export type InterviewType = 'TEXT' | 'VOICE'
export type InterviewDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
export type InterviewStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface JobPosting {
  id: string
  userId: string
  title: string
  company: string | null
  url: string | null
  content: string
  status: JobPostingStatus
  analyzedKeywords: string | null
  analyzedRequirements: string | null
  createdAt: string
  updatedAt: string
}

export interface GeneratedDocument {
  id: string
  jobPostingId: string
  userId: string
  type: DocumentType
  title: string
  content: string
  createdAt: string
  updatedAt: string
  versions?: DocumentVersion[]
}

export interface DocumentVersion {
  id: string
  documentId: string
  content: string
  versionNumber: number
  createdAt: string
}

export interface Application {
  id: string
  userId: string
  jobPostingId: string
  status: ApplicationStatus
  appliedAt: string
  notes: string | null
  updatedAt: string
  jobPosting?: JobPosting
}

export interface InterviewSession {
  id: string
  applicationId: string
  userId: string
  type: InterviewType
  difficulty: InterviewDifficulty
  status: InterviewStatus
  startedAt: string
  endedAt: string | null
  feedback: string | null
  messages?: InterviewMessage[]
}

export interface InterviewMessage {
  id: string
  sessionId: string
  role: 'INTERVIEWER' | 'USER'
  content: string
  createdAt: string
}

export interface SelfEvaluation {
  id: string
  applicationId: string
  userId: string
  performance: number
  strengths: string | null
  improvements: string | null
  questionsAsked: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}
