import { api } from './client'
import type {
  ApiResponse,
  Thesis,
  CreateThesisRequest,
  ThesisStatusHistory,
  MentorDecision,
} from '@/types/api'

/**
 * One module per backend domain. Each function:
 *   1. Wraps a single endpoint
 *   2. Unwraps the ApiResponse envelope
 *   3. Returns just the .data payload
 *
 * This keeps components clean — they never touch the envelope.
 */
export const thesisApi = {
  // POST /api/theses
  create: async (data: CreateThesisRequest): Promise<Thesis> => {
    const res = await api.post<ApiResponse<Thesis>>('/theses', data)
    return res.data.data
  },

  // GET /api/theses/my
  getMy: async (): Promise<Thesis[]> => {
    const res = await api.get<ApiResponse<Thesis[]>>('/theses/my')
    return res.data.data
  },

  // GET /api/theses/{id}
  getById: async (id: string): Promise<Thesis> => {
    const res = await api.get<ApiResponse<Thesis>>(`/theses/${id}`)
    return res.data.data
  },

  // GET /api/theses/by-registration-number/{number}
  findByRegistrationNumber: async (number: string): Promise<Thesis> => {
    const res = await api.get<ApiResponse<Thesis>>(`/theses/by-registration-number/${encodeURIComponent(number)}`)
    return res.data.data
  },

  // GET /api/theses/{id}/application-pdf — returns the PDF as a Blob
  downloadApplicationPdf: async (id: string): Promise<Blob> => {
    const res = await api.get(`/theses/${id}/application-pdf`, { responseType: 'blob' })
    return res.data
  },

  // GET /api/theses/{id}/history
  getHistory: async (id: string): Promise<ThesisStatusHistory[]> => {
    const res = await api.get<ApiResponse<ThesisStatusHistory[]>>(`/theses/${id}/history`)
    return res.data.data
  },

  // PATCH /api/theses/{id}/eligibility
  decideEligibility: async (id: string, approved: boolean): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/eligibility`, { approved })
    return res.data.data
  },

  // PATCH /api/theses/{id}/mentor-request
  submitMentorRequest: async (id: string, mentorId: string, studentComment?: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/mentor-request`, { mentorId, studentComment })
    return res.data.data
  },

  // PATCH /api/theses/{id}/mentor-decision
  decideMentorRequest: async (id: string, decision: MentorDecision, mentorComment?: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/mentor-decision`, { decision, mentorComment })
    return res.data.data
  },

  // PATCH /api/theses/{id}/revise-proposal
  reviseProposal: async (id: string, title: string, studentComment?: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/revise-proposal`, { title, studentComment })
    return res.data.data
  },

  // PATCH /api/theses/{id}/submit-application
  submitApplication: async (id: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/submit-application`)
    return res.data.data
  },

  // PATCH /api/theses/{id}/archive-validate
  archiveValidate: async (id: string, approved: boolean, comment?: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/archive-validate`, { approved, comment })
    return res.data.data
  },

  // PATCH /api/theses/{id}/service-validate
  serviceValidate: async (id: string, approved: boolean, comment?: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/service-validate`, { approved, comment })
    return res.data.data
  },

  // PATCH /api/theses/{id}/approve-final
  approveFinal: async (id: string): Promise<Thesis> => {
    const res = await api.patch<ApiResponse<Thesis>>(`/theses/${id}/approve-final`)
    return res.data.data
  },
}
