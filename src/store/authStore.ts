import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types/api'

interface User {
  id: string
  email: string
  fullName: string
  role: Role
}

interface AuthState {
  token: string | null
  user: User | null
  // Derived helper — true if a token exists
  isAuthenticated: () => boolean
  // Actions
  login: (token: string, user: User) => void
  logout: () => void
}

/**
 * Auth state lives here. We use Zustand with the persist middleware so
 * the token and user survive page reloads via localStorage.
 *
 * Why Zustand over Context API:
 *   - No <Provider> wrapping in main.tsx
 *   - Can be accessed in non-component code (like axios interceptors)
 *   - Selective subscriptions — components re-render only when watched fields change
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      isAuthenticated: () => !!get().token,

      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'praksa-auth',  // localStorage key
      // Only persist these fields — derived/methods are not persisted
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
