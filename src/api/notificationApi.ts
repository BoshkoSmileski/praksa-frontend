import { api } from './client'
import type { ApiResponse, Notification } from '@/types/api'

export const notificationApi = {
  // GET /api/notifications/my
  getMy: async (): Promise<Notification[]> => {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications/my')
    return res.data.data
  },
}
