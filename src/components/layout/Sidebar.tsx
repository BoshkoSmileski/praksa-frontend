import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Bell,
  Archive,
  Coins,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { notificationApi } from '@/api/notificationApi'
import { cn } from '@/utils/cn'
import type { Role } from '@/types/api'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]   // which roles see this item
}

// Single source of truth for navigation. Each role only sees items it's allowed.
const navItems: NavItem[] = [
  { label: 'Dashboard',     to: '/dashboard',     icon: LayoutDashboard, roles: ['STUDENT', 'MENTOR', 'STUDENT_SERVICE', 'COMMITTEE', 'ARCHIVE'] },
  { label: 'My Theses',     to: '/theses',        icon: FileText,        roles: ['STUDENT', 'MENTOR', 'STUDENT_SERVICE', 'ARCHIVE'] },
  { label: 'Committee',     to: '/committee',     icon: Users,           roles: ['MENTOR', 'STUDENT_SERVICE', 'COMMITTEE'] },
  { label: 'Defenses',      to: '/defenses',      icon: Calendar,        roles: ['STUDENT', 'MENTOR', 'COMMITTEE', 'STUDENT_SERVICE'] },
  { label: 'Notifications', to: '/notifications', icon: Bell,            roles: ['STUDENT', 'MENTOR', 'STUDENT_SERVICE', 'COMMITTEE', 'ARCHIVE'] },
  { label: 'Archive',       to: '/archive',       icon: Archive,         roles: ['STUDENT_SERVICE', 'ARCHIVE'] },
  { label: 'Student Credits', to: '/students',    icon: Coins,           roles: ['STUDENT_SERVICE'] },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  // Unread notification count for the Notifications nav badge. Refetched on every
  // route change so it stays current after the user reads notifications and navigates
  // away — no polling, no extra state library. Failures are swallowed (badge just hides).
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    notificationApi
      .getUnreadCount()
      .then((count) => {
        if (!cancelled) setUnreadCount(count)
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  if (!user) return null

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6 dark:border-gray-800">
        <div className="rounded-lg bg-brand-600 p-2">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-50">
            DiplomaSystem
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Thesis Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span
                  title={`${unreadCount} unread`}
                  className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
