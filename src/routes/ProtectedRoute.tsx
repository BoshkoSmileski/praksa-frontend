import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types/api'

interface ProtectedRouteProps {
  // If provided, only these roles can access the route.
  // Omit to allow any authenticated user.
  allowedRoles?: Role[]
}

/**
 * Wraps routes that require authentication (and optionally a specific role).
 *
 * - Not logged in → redirect to /login (preserves the original destination)
 * - Logged in but wrong role → redirect to /dashboard
 * - Otherwise → render the child route
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated()) {
    // Pass the requested URL via state so we can redirect there after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
