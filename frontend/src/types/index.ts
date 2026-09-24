export type Role = 'CANDIDATE' | 'RECRUITER' | 'ADMIN'

export type ApplicationStage =
  | 'APPLIED' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED'
  | 'HIRED' | 'REJECTED' | 'WITHDRAWN' | 'STALE_BREACHED'

export interface UserSummary {
  id: string
  email: string
  fullName: string
  role: Role
  companyId?: string | null
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: UserSummary
}

export interface StageConfig {
  stage: ApplicationStage
  slaBusinessHours: number
}

export interface Job {
  id: string
  title: string
  department: string | null
  location: string | null
  description: string | null
  active: boolean
  companyName: string
  companySlug: string
  responsivenessScore: number
  verifiedEmployer?: boolean
  stageConfigs: StageConfig[]
}

export interface ApplicationSummary {
  id: string
  jobId: string
  jobTitle: string
  candidateName: string
  candidateEmail: string
  currentStage: ApplicationStage
  stageEnteredAt: string
  slaDeadlineAt: string | null
  nudgeSent: boolean
  breached: boolean
  urgencyIndex: number
  resumeObjectKey?: string | null
  atsScore?: number
  matchedSkills?: string[]
  missingSkills?: string[]
  fitCategory?: 'STRONG_FIT' | 'GOOD_FIT' | 'POTENTIAL_FIT' | 'LOW_FIT'
  suggestedQuestions?: string[]
  resumeUnlocked?: boolean
}

export interface HistoryEntry {
  fromStage: ApplicationStage | null
  toStage: ApplicationStage
  actorName: string
  createdAt: string
  durationBusinessHours: number | null
  note?: string | null
}

export interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface ApplicationDetail {
  summary: ApplicationSummary
  history: HistoryEntry[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
  timestamp: string
}
