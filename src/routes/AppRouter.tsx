import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ThesesListPage } from '@/pages/ThesesListPage'
import { CreateThesisPage } from '@/pages/CreateThesisPage'
import { ThesisDetailPage } from '@/pages/ThesisDetailPage'
import { NotificationsPage } from '@/pages/NotificationsPage'

/**
 * Central route configuration.
 *
 * Structure:
 *   /login                  → AuthLayout (public)
 *   /                       → redirects to /dashboard
 *   /dashboard, /theses ... → AppLayout + ProtectedRoute (auth required)
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/theses" element={<ThesesListPage />} />
            <Route path="/theses/new" element={<CreateThesisPage />} />
            <Route path="/theses/:id" element={<ThesisDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            {/* More routes will be added here as we build features */}
          </Route>
        </Route>

        {/* Default + 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
