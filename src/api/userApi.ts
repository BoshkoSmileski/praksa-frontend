import { api } from './client'
import type { ApiResponse, Role, UserSummary } from '@/types/api'

export const userApi = {
  // GET /api/users?role=MENTOR
  getByRole: async (role: Role): Promise<UserSummary[]> => {
    const res = await api.get<ApiResponse<UserSummary[]>>('/users', { params: { role } })
    return res.data.data
  },
}
