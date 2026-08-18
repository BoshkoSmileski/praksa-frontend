import { api } from './client'
import type { ApiResponse, MentorSummary, StudentSummary, UserDetail } from '@/types/api'

export const userApi = {
  // GET /api/users?role=MENTOR — mentor picker (identity only, no PII).
  // Allowed for STUDENT (mentor request), MENTOR (propose committee), STUDENT_SERVICE.
  getMentors: async (): Promise<MentorSummary[]> => {
    const res = await api.get<ApiResponse<MentorSummary[]>>('/users', { params: { role: 'MENTOR' } })
    return res.data.data
  },

  // GET /api/users?role=STUDENT — STUDENT_SERVICE-only credit list (full student fields).
  getStudents: async (): Promise<StudentSummary[]> => {
    const res = await api.get<ApiResponse<StudentSummary[]>>('/users', { params: { role: 'STUDENT' } })
    return res.data.data
  },

  // GET /api/users/me — the authenticated user's own details (incl. credits)
  getMe: async (): Promise<UserDetail> => {
    const res = await api.get<ApiResponse<UserDetail>>('/users/me')
    return res.data.data
  },

  // PATCH /api/users/{id}/credits — STUDENT_SERVICE only
  updateCredits: async (userId: string, credits: number): Promise<UserDetail> => {
    const res = await api.patch<ApiResponse<UserDetail>>(`/users/${userId}/credits`, { credits })
    return res.data.data
  },
}
