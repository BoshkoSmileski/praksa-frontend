import { api } from './client'
import type { ApiResponse, Notification } from '@/types/api'

export const notificationApi = {
  // GET /api/notifications/my
  getMy: async (): Promise<Notification[]> => {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications/my')
    return res.data.data
  },

  // GET /api/notifications/unread-count  (P3.6)
  // Returns the authenticated user's own unread notification count.
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count'
    )
    return res.data.data.unreadCount
  },

  // PATCH /api/notifications/{id}/read  (P3.6)
  // Marks a single notification (owned by the caller) as read. Returns the updated row.
  markRead: async (id: string): Promise<Notification> => {
    const res = await api.patch<ApiResponse<Notification>>(
      `/notifications/${id}/read`
    )
    return res.data.data
  },

  // PATCH /api/notifications/read-all  (P3.6)
  // Marks all of the caller's unread notifications as read. Returns how many were marked.
  markAllRead: async (): Promise<number> => {
    const res = await api.patch<ApiResponse<{ markedRead: number }>>(
      '/notifications/read-all'
    )
    return res.data.data.markedRead
  },
}
