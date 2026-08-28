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

    if (status === 401) {
      // 401 = UNAUTHENTICATED: the JWT is missing, invalid, or expired — the session
      // itself is no longer usable. Clear it and send the user back to login.
      const logout = useAuthStore.getState().logout
      if (useAuthStore.getState().token) {
        logout()
        toast.error('Сесијата истече. Ве молиме најавете се повторно.')
        // Use hash redirect to avoid React Router import inside a non-component
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    } else if (status === 403) {
      // 403 = FORBIDDEN: the session is still valid, but the user is not allowed to
      // read/act on THIS particular resource (e.g. a thesis they are not related to —
      // the read-side IDOR guard). This must NOT destroy the valid session. Surface a
      // resource-level access-denied error and let the calling component decide how to
      // present it (empty/not-authorized state); do not log the user out or redirect.
      toast.error(backendMessage || 'Немате пристап до овој ресурс.')
    } else if (status && status >= 500) {
      toast.error('Грешка на серверот. Обидете се повторно подоцна.')
    } else if (backendMessage) {
      // For 400 errors, surface the backend's helpful message.
      toast.error(backendMessage)
    } else {
      toast.error('Мрежна грешка. Проверете ја вашата интернет-врска.')
    }

    return Promise.reject(error)
  }
)
