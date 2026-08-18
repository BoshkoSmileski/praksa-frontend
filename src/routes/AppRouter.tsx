import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ThesesListPage } from '@/pages/ThesesListPage'
import { CreateThesisPage } from '@/pages/CreateThesisPage'
import { ThesisDetailPage } from '@/pages/ThesisDetailPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { CommitteePage } from '@/pages/CommitteePage'
import { DefensesPage } from '@/pages/DefensesPage'
import { ArchivePage } from '@/pages/ArchivePage'
import { ManageCreditsPage } from '@/pages/ManageCreditsPage'

/**
 * Central route configuration.
 *
 * Structure:
 *   /login                  → AuthLayout (public)
 *   /register               → AuthLayout (public — student self-registration)
 *   /                       → redirects to /dashboard
 *   /dashboard, /theses ... → AppLayout + ProtectedRoute (auth required)
 *
 * Role-restricted routes wrap ProtectedRoute with an allowedRoles list;
 * unauthorised users are bounced back to /dashboard.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/theses" element={<ThesesListPage />} />
            <Route path="/theses/new" element={<CreateThesisPage />} />
            <Route path="/theses/:id" element={<ThesisDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* Committee — matches sidebar's role list */}
        <Route element={<ProtectedRoute allowedRoles={['MENTOR', 'STUDENT_SERVICE', 'COMMITTEE']} />}>
          <Route element={<AppLayout />}>
            <Route path="/committee" element={<CommitteePage />} />
          </Route>
        </Route>

        {/* Defenses — matches sidebar's role list */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'MENTOR', 'COMMITTEE', 'STUDENT_SERVICE']} />}>
          <Route element={<AppLayout />}>
            <Route path="/defenses" element={<DefensesPage />} />
          </Route>
        </Route>

        {/* Archive — validation queue + archived records */}
        <Route element={<ProtectedRoute allowedRoles={['ARCHIVE', 'STUDENT_SERVICE']} />}>
          <Route element={<AppLayout />}>
            <Route path="/archive" element={<ArchivePage />} />
          </Route>
        </Route>

        {/* Student credits — STUDENT_SERVICE records/updates credit balances */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT_SERVICE']} />}>
          <Route element={<AppLayout />}>
            <Route path="/students" element={<ManageCreditsPage />} />
          </Route>
        </Route>

        {/* Default + 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
