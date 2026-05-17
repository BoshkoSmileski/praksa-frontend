import { cn } from '@/utils/cn'
import type { ThesisStatus } from '@/types/api'

interface StatusBadgeProps {
  status: ThesisStatus
  className?: string
}

// One config object — one source of truth for status colors and labels.
// To add a new status: just add an entry here.
const statusConfig: Record<ThesisStatus, { label: string; classes: string }> = {
  PENDING_ELIGIBILITY_CHECK: { label: 'Pending Eligibility',     classes: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900' },
  ELIGIBILITY_REJECTED:      { label: 'Eligibility Rejected',    classes: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900' },
  TOPIC_SELECTION:           { label: 'Topic Selection',         classes: 'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900' },
  PENDING_MENTOR_APPROVAL:   { label: 'Awaiting Mentor',         classes: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900' },
  MENTOR_REJECTED_TOPIC:     { label: 'Mentor Rejected',         classes: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900' },
  APPLICATION_SUBMITTED:     { label: 'Application Submitted',   classes: 'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900' },
  ADMINISTRATIVE_VALIDATION: { label: 'Admin Validation',        classes: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900' },
  IN_PROGRESS:               { label: 'In Progress',             classes: 'bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-900' },
  FINAL_SUBMITTED:           { label: 'Final Submitted',         classes: 'bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:ring-purple-900' },
  MENTOR_APPROVED:           { label: 'Mentor Approved',         classes: 'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-900' },
  COMMITTEE_REVIEW:          { label: 'Committee Review',        classes: 'bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-900' },
  COMMITTEE_ACCEPTED:        { label: 'Committee Accepted',      classes: 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900' },
  PENDING_DEFENSE_CHECK:     { label: 'Defense Check',           classes: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900' },
  DEFENSE_SCHEDULED:         { label: 'Defense Scheduled',       classes: 'bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-200 dark:ring-cyan-900' },
  ARCHIVED:                  { label: 'Archived',                classes: 'bg-green-100 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  )
}
