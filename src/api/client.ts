import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

// Use the Vite proxy in dev — see vite.config.ts.
// In production, replace with your real backend URL.
const baseURL = '/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// ---------- REQUEST INTERCEPTOR ----------
// Attach the JWT token from the auth store to every outgoing request.
// This single function eliminates the need to manually add headers anywhere else.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------- RESPONSE INTERCEPTOR ----------
// Handle errors globally so individual components don't need to.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    const status = error.response?.status
    const backendMessage = error.response?.data?.message

    if (status === 401 || status === 403) {
      // Token expired or insufficient permissions — log out and redirect.
      const logout = useAuthStore.getState().logout
      if (useAuthStore.getState().token) {
        logout()
        toast.error('Your session has expired. Please log in again.')
        // Use hash redirect to avoid React Router import inside a non-component
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (backendMessage) {
      // For 400 errors, surface the backend's helpful message.
      toast.error(backendMessage)
    } else {
      toast.error('Network error. Check your connection.')
    }

    return Promise.reject(error)
  }
)
