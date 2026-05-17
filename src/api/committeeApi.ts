import { api } from './client'
import type { ApiResponse, CommitteeMember } from '@/types/api'

export const committeeApi = {
  // GET /api/theses/{thesisId}/committee
  list: async (thesisId: string): Promise<CommitteeMember[]> => {
    const res = await api.get<ApiResponse<CommitteeMember[]>>(`/theses/${thesisId}/committee`)
    return res.data.data
  },

  // POST /api/theses/{thesisId}/committee/propose
  propose: async (thesisId: string, professorIds: string[]): Promise<CommitteeMember[]> => {
    const res = await api.post<ApiResponse<CommitteeMember[]>>(
      `/theses/${thesisId}/committee/propose`,
      { professorIds }
    )
    return res.data.data
  },

  // POST /api/theses/{thesisId}/committee/approve
  approve: async (thesisId: string): Promise<CommitteeMember[]> => {
    const res = await api.post<ApiResponse<CommitteeMember[]>>(
      `/theses/${thesisId}/committee/approve`
    )
    return res.data.data
  },

  // PATCH /api/theses/{thesisId}/committee/{memberId}/review
  submitReview: async (thesisId: string, memberId: string, notes: string): Promise<CommitteeMember> => {
    const res = await api.patch<ApiResponse<CommitteeMember>>(
      `/theses/${thesisId}/committee/${memberId}/review`,
      { notes }
    )
    return res.data.data
  },

  // POST /api/theses/{thesisId}/committee/accept-review
  acceptReview: async (thesisId: string): Promise<void> => {
    await api.post(`/theses/${thesisId}/committee/accept-review`)
  },
}
