import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle, XCircle, CheckCheck, Check } from 'lucide-react'
import { toast } from 'sonner'
import { notificationApi } from '@/api/notificationApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/utils/date'
import { cn } from '@/utils/cn'
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
  DEFENSE_ELIGIBILITY_VERIFIED: 'Defense Eligibility Verified',
  DEFENSE_REQUESTED: 'Defense Requested',
  DEFENSE_SCHEDULED: 'Defense Scheduled',
  DEFENSE_CANCELLED: 'Defense Cancelled',
  THESIS_GRADED: 'Thesis Graded',
  THESIS_ARCHIVED: 'Thesis Archived',
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    notificationApi
      .getMy()
      .then(setNotifications)
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Mark one notification read: update just that row in place on success.
  // The axios interceptor surfaces any error toast (401 vs 403 handled globally).
  const handleMarkRead = async (id: string) => {
    // optimistic-safe: only flip after the server confirms ownership + persistence
    await notificationApi.markRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      const marked = await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success(
        marked > 0
          ? `Marked ${marked} notification${marked === 1 ? '' : 's'} as read`
          : 'No unread notifications'
      )
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Recent system notifications about your theses and tasks"
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read ({unreadCount})
            </button>
          ) : undefined
        }
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
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => Promise<void>
}) {
  const label = typeLabels[notification.type] ?? notification.type
  const isUnread = !notification.read
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      await onMarkRead(notification.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={cn(
        'card p-4 transition-colors',
        // Unread notifications are visually distinct: brand-tinted background and a
        // left accent bar. Read notifications use the default card styling.
        isUnread &&
          'border-l-4 border-l-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-full p-2 shrink-0',
            isUnread
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isUnread && (
              <span
                title="Unread"
                className="h-2 w-2 shrink-0 rounded-full bg-brand-500"
              />
            )}
            <p
              className={cn(
                'text-sm',
                isUnread
                  ? 'font-semibold text-gray-900 dark:text-gray-50'
                  : 'font-medium text-gray-700 dark:text-gray-300'
              )}
            >
              {label}
            </p>
            {notification.sent ? (
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
        {isUnread && (
          <button
            type="button"
            onClick={handleClick}
            disabled={busy}
            title="Mark as read"
            className="btn-secondary inline-flex items-center gap-1 self-center whitespace-nowrap px-2.5 py-1.5 text-xs"
          >
            <Check className="h-3.5 w-3.5" />
            Mark read
          </button>
        )}
      </div>
    </div>
  )
}
