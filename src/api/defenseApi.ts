import { api } from './client'
import type { ApiResponse, Defense, DefenseRequest, DefenseResult } from '@/types/api'

export const defenseApi = {
  // POST /api/theses/{thesisId}/defenses/request — STUDENT proposes the actual room,
  // date, and time. Stored as a PENDING DefenseRequest — does NOT create a Defense and
  // does NOT change the thesis status. Awaits a Student Service decision.
  createRequest: async (thesisId: string, room: string, scheduledAt: string): Promise<DefenseRequest> => {
    const res = await api.post<ApiResponse<DefenseRequest>>(
      `/theses/${thesisId}/defenses/request`,
      { room, scheduledAt }
    )
    return res.data.data
  },

  // PATCH /api/theses/{thesisId}/defenses/request/decision — STUDENT_SERVICE approves or
  // rejects the thesis's current PENDING request. Approval creates the real Defense and
  // schedules the thesis; the backend re-validates room availability and the date window
  // against the CURRENT database state (never trust a client-side check).
  decideRequest: async (thesisId: string, approved: boolean, reason?: string): Promise<DefenseRequest> => {
    const res = await api.patch<ApiResponse<DefenseRequest>>(
      `/theses/${thesisId}/defenses/request/decision`,
      { approved, reason }
    )
    return res.data.data
  },

  // GET /api/theses/{thesisId}/defenses/request — full proposal history for this thesis
  // (current + past rejected/approved), newest first. Thesis-scoped.
  getRequests: async (thesisId: string): Promise<DefenseRequest[]> => {
    const res = await api.get<ApiResponse<DefenseRequest[]>>(`/theses/${thesisId}/defenses/request`)
    return res.data.data
  },

  // GET /api/theses/{thesisId}/defenses/active
  getActive: async (thesisId: string): Promise<Defense | null> => {
    try {
      const res = await api.get<ApiResponse<Defense>>(`/theses/${thesisId}/defenses/active`)
      return res.data.data
    } catch {
      // 404 when no active defense exists — return null
      return null
    }
  },

  // GET /api/theses/{thesisId}/defenses
  listAll: async (thesisId: string): Promise<Defense[]> => {
    const res = await api.get<ApiResponse<Defense[]>>(`/theses/${thesisId}/defenses`)
    return res.data.data
  },

  // PATCH /api/theses/{thesisId}/defenses/cancel
  cancel: async (thesisId: string): Promise<Defense> => {
    const res = await api.patch<ApiResponse<Defense>>(`/theses/${thesisId}/defenses/cancel`)
    return res.data.data
  },

  // POST /api/theses/{thesisId}/defenses/{defenseId}/result
  recordResult: async (thesisId: string, defenseId: string, grade: number, notes?: string): Promise<DefenseResult> => {
    const res = await api.post<ApiResponse<DefenseResult>>(
      `/theses/${thesisId}/defenses/${defenseId}/result`,
      { grade, notes }
    )
    return res.data.data
  },

  // GET /api/theses/{thesisId}/defenses/{defenseId}/result
  getResult: async (thesisId: string, defenseId: string): Promise<DefenseResult | null> => {
    try {
      const res = await api.get<ApiResponse<DefenseResult>>(
        `/theses/${thesisId}/defenses/${defenseId}/result`
      )
      return res.data.data
    } catch {
      return null
    }
  },

  // GET /api/theses/{thesisId}/defenses/{defenseId}/record-pdf — the defense record
  // ("записник за одбрана") as a PDF Blob. Only available once the defense is graded.
  downloadRecordPdf: async (thesisId: string, defenseId: string): Promise<Blob> => {
    const res = await api.get(
      `/theses/${thesisId}/defenses/${defenseId}/record-pdf`,
      { responseType: 'blob' }
    )
    return res.data
  },
}
