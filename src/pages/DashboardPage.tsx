import { Link } from 'react-router-dom'
import { FileText, ArrowRight, Bell, Users, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Role } from '@/types/api'

interface QuickAction {
  to: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

const actions: QuickAction[] = [
  { to: '/theses',        title: 'View Theses',          description: 'See all your theses and their current status', icon: FileText, roles: ['STUDENT', 'MENTOR', 'ADMIN', 'ARCHIVE'] },
  { to: '/notifications', title: 'Notifications',        description: 'Recent system notifications',                  icon: Bell,     roles: ['STUDENT', 'MENTOR', 'ADMIN', 'COMMITTEE', 'ARCHIVE'] },
  { to: '/committee',     title: 'Committee Management', description: 'Review thesis defense committees',             icon: Users,    roles: ['MENTOR', 'ADMIN', 'COMMITTEE'] },
  { to: '/defenses',      title: 'Defense Scheduling',   description: 'Schedule, cancel or attend a defense',         icon: Calendar, roles: ['STUDENT', 'MENTOR', 'COMMITTEE', 'ADMIN'] },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const visible = actions.filter((a) => a.roles.includes(user.role))

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.fullName.split(' ')[0]}`}
        description={`Signed in as ${user.role}`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="card group p-6 hover:ring-2 hover:ring-brand-500 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-100 p-3 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 group-hover:text-brand-600">
                    {action.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
