import { api } from './client'
import type {
  ApiResponse,
  ThesisVersion,
  ThesisComment,
} from '@/types/api'
import type { AxiosProgressEvent } from 'axios'

export const versionApi = {
  // GET /api/theses/{thesisId}/versions
  list: async (thesisId: string): Promise<ThesisVersion[]> => {
    const res = await api.get<ApiResponse<ThesisVersion[]>>(`/theses/${thesisId}/versions`)
    return res.data.data
  },

  /**
   * POST /api/theses/{thesisId}/versions
   *
   * Two important things here:
   *  1. FormData (not JSON) — multipart upload
   *  2. We override Content-Type to multipart/form-data with explicit boundary handling
   *     by NOT setting it — letting the browser/axios figure it out from the FormData
   */
  upload: async (
    thesisId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<ThesisVersion> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await api.post<ApiResponse<ThesisVersion>>(
      `/theses/${thesisId}/versions`,
      formData,
      {
        // CRITICAL: undefined content-type lets axios set the proper multipart boundary
        headers: { 'Content-Type': undefined },
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (onProgress && event.total) {
            const percent = Math.round((event.loaded * 100) / event.total)
            onProgress(percent)
          }
        },
      }
    )
    return res.data.data
  },

  // PATCH /api/theses/{thesisId}/versions/{versionId}/mark-final
  markFinal: async (thesisId: string, versionId: string): Promise<ThesisVersion> => {
    const res = await api.patch<ApiResponse<ThesisVersion>>(
      `/theses/${thesisId}/versions/${versionId}/mark-final`
    )
    return res.data.data
  },

  // GET /api/theses/{thesisId}/versions/{versionId}/comments
  listComments: async (thesisId: string, versionId: string): Promise<ThesisComment[]> => {
    const res = await api.get<ApiResponse<ThesisComment[]>>(
      `/theses/${thesisId}/versions/${versionId}/comments`
    )
    return res.data.data
  },

  // POST /api/theses/{thesisId}/versions/{versionId}/comments
  addComment: async (thesisId: string, versionId: string, content: string): Promise<ThesisComment> => {
    const res = await api.post<ApiResponse<ThesisComment>>(
      `/theses/${thesisId}/versions/${versionId}/comments`,
      { content }
    )
    return res.data.data
  },

  /**
   * Build a direct download URL with the auth token attached as a query param.
   * The browser opens it in a new tab and the backend streams the PDF.
   *
   * NOTE: backend currently expects the token in the Authorization header.
   * To make this work for window.open() we'd need to either:
   *   (a) accept the token as a query param on the download endpoint, or
   *   (b) fetch the blob via axios and use URL.createObjectURL.
   *
   * We use approach (b) below in downloadBlob() for security.
   */
  downloadBlob: async (thesisId: string, versionId: string): Promise<Blob> => {
    const res = await api.get(
      `/theses/${thesisId}/versions/${versionId}/download`,
      { responseType: 'blob' }
    )
    return res.data
  },
}
