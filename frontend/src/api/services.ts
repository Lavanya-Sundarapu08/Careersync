import client from './client'
import type {
  ApiResponse, TokenResponse, Job, ApplicationSummary, ApplicationDetail, ApplicationStage, Notification
} from '../types'

// ---------------- Auth ----------------
export const authApi = {
  login: (email: string, password: string) =>
    client.post<ApiResponse<TokenResponse>>('/auth/login', { email, password }),
  register: (payload: { email: string; password: string; fullName: string; role: string; companySlug?: string }) =>
    client.post<ApiResponse<TokenResponse>>('/auth/register', payload),
}

// ---------------- Jobs ----------------
export const jobsApi = {
  list: () => client.get<ApiResponse<Job[]>>('/jobs'),
  get: (id: string) => client.get<ApiResponse<Job>>(`/jobs/${id}`),
  create: (payload: {
    title: string; department?: string; location?: string; description?: string;
    stageConfigs: { stage: ApplicationStage; slaBusinessHours: number }[]
  }) => client.post<ApiResponse<Job>>('/jobs', payload),
}

// ---------------- Applications ----------------
export const applicationsApi = {
  resumeUploadUrl: (filename: string) =>
    client.post<ApiResponse<{ uploadUrl: string; objectKey: string; expiresAt: string }>>(
      `/applications/resume-upload-url?filename=${encodeURIComponent(filename)}`
    ),
  apply: (jobId: string, resumeObjectKey: string) =>
    client.post<ApiResponse<ApplicationSummary>>('/applications', { jobId, resumeObjectKey }),
  mine: () => client.get<ApiResponse<ApplicationSummary[]>>('/applications/mine'),
  queue: () => client.get<ApiResponse<ApplicationSummary[]>>('/applications/queue'),
  detail: (id: string) => client.get<ApiResponse<ApplicationDetail>>(`/applications/${id}`),
  transition: (id: string, targetStage: ApplicationStage, note?: string) =>
    client.post<ApiResponse<ApplicationSummary>>(`/applications/${id}/transition`, { targetStage, note }),
  withdraw: (id: string) => client.post<ApiResponse<void>>(`/applications/${id}/withdraw`),
  resumeDownloadUrl: (id: string) =>
    client.get<ApiResponse<{ downloadUrl: string; objectKey: string; expiresAt: string }>>(
      `/applications/${id}/resume-url`
    ),
  downloadResume: (id: string) =>
    client.get<Blob>(`/applications/${id}/resume`, { responseType: 'blob' }),
}

// ---------------- Companies ----------------
export const companiesApi = {
  get: (slug: string) => client.get<ApiResponse<{ name: string; responsivenessScore: number; badge: string }>>(
    `/companies/${slug}`
  ),
}

// ---------------- Notifications ----------------
export const notificationsApi = {
  getAll: () => client.get<ApiResponse<Notification[]>>('/notifications'),
  unreadCount: () => client.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),
  markRead: (id: string) => client.patch<ApiResponse<void>>(`/notifications/${id}/read`),
  markAllRead: () => client.patch<ApiResponse<void>>('/notifications/read-all'),
}
