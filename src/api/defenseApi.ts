import { api } from './client'
import type { ApiResponse, Defense, DefenseResult, Thesis } from '@/types/api'

export const defenseApi = {
  // POST /api/theses/{thesisId}/defenses/request — STUDENT requests a defense.
  // Returns the updated thesis (now PENDING_DEFENSE_SCHEDULING). No Defense row yet.
  request: async (thesisId: string): Promise<Thesis> => {
    const res = await api.post<ApiResponse<Thesis>>(`/theses/${thesisId}/defenses/request`)
    return res.data.data
  },

  // POST /api/theses/{thesisId}/defenses — STUDENT_SERVICE schedules the defense
  schedule: async (thesisId: string, room: string, scheduledAt: string): Promise<Defense> => {
    const res = await api.post<ApiResponse<Defense>>(
      `/theses/${thesisId}/defenses`,
      { room, scheduledAt }
    )
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
