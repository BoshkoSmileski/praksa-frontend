import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react'
import { notificationApi } from '@/api/notificationApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/utils/date'
import type { Notification } from '@/types/api'

// Friendly labels for notification types coming from the backend enum.
// Keeps the UI human-readable without changing the API.
const typeLabels: Record<string, string> = {
  ELIGIBILITY_APPROVED: 'Eligibility Approved',
  ELIGIBILITY_REJECTED: 'Eligibility Rejected',
  MENTOR_REQUEST_RECEIVED: 'New Mentor Request',
  MENTOR_ACCEPTED_TOPIC: 'Topic Accepted by Mentor',
  MENTOR_REJECTED_TOPIC: 'Topic Rejected by Mentor',
  APPLICATION_VALIDATED: 'Application Validated',
  FINAL_VERSION_SUBMITTED: 'Final Version Submitted',
  MENTOR_APPROVED_THESIS: 'Mentor Approved Thesis',
  COMMITTEE_FORMED: 'Committee Formed',
  COMMITTEE_REVIEW_ACCEPTED: 'Committee Review Accepted',
  DEFENSE_SCHEDULED: 'Defense Scheduled',
  DEFENSE_CANCELLED: 'Defense Cancelled',
  THESIS_GRADED: 'Thesis Graded',
  THESIS_ARCHIVED: 'Thesis Archived',
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationApi
      .getMy()
      .then(setNotifications)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Recent system notifications about your theses and tasks"
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BellOff className="h-8 w-8" />}
            title="No notifications yet"
            description="You'll see notifications here when something happens with your theses."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationCard({ notification }: { notification: Notification }) {
  const label = typeLabels[notification.type] ?? notification.type
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-brand-100 p-2 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shrink-0">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
              {label}
            </p>
            {notification.isSent ? (
              <span
                title="Email sent"
                className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle className="h-3 w-3" />
                Sent
              </span>
            ) : (
              <span
                title="Email send pending or failed"
                className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
              >
                <XCircle className="h-3 w-3" />
                Pending
              </span>
            )}
          </div>
          {notification.thesisTitle && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 truncate">
              Thesis: {notification.thesisTitle}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
