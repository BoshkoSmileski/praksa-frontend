import { useEffect, useState } from 'react'
import { Users, Search, X, Hash, Mail, Coins, Pencil, AlertTriangle } from 'lucide-react'
import { userApi } from '@/api/userApi'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { EditCreditsModal } from '@/features/credits/EditCreditsModal'
import type { StudentSummary, UserDetail } from '@/types/api'

const REQUIRED_CREDITS = 200

/**
 * STUDENT_SERVICE-only page for recording/updating a student's credit balance.
 *
 * Closes the "credits can only be set via Swagger/API" gap: a newly-registered
 * student starts with null credits and cannot pass the 200-credit thesis gate
 * until Student Service records them here. Wired to the existing, server-side
 * restricted endpoint PATCH /api/users/{id}/credits — this page is a usability
 * layer only; the backend authorization is authoritative.
 */
export function ManageCreditsPage() {
  const user = useAuthStore((s) => s.user)
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<StudentSummary | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    userApi
      .getStudents()
      .then(setStudents)
      .catch(() => {
        // Toast already shown by axios interceptor
      })
      .finally(() => setLoading(false))
  }, [])

  // Defensive: this is not the security boundary (the backend is), but there is
  // no reason to render the editor for a non-STUDENT_SERVICE user who reached
  // the route some other way.
  if (user && user.role !== 'STUDENT_SERVICE') {
    return (
      <div>
        <PageHeader title="Student Credits" />
        <div className="card p-6 flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          Only Student Service can manage student credits.
        </div>
      </div>
    )
  }

  // Reflect a successful update in the list without a full refetch.
  const handleUpdated = (updated: UserDetail) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === updated.id ? { ...s, credits: updated.credits, indexNumber: updated.indexNumber } : s
      )
    )
  }

  const openEditor = (student: StudentSummary) => {
    setEditing(student)
    setModalOpen(true)
  }

  const q = filter.trim().toLowerCase()
  const visible = q
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.indexNumber?.toLowerCase().includes(q) ?? false)
      )
    : students

  return (
    <div>
      <PageHeader
        title="Student Credits"
        description="Find a student and record or update their credit balance."
      />

      {/* Search — find a student by name, email, or index number (no UUID needed) */}
      {(students.length > 5 || filter) && (
        <div className="card p-3 mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400 ml-1 shrink-0" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name, email, or index number..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <LoadingList />
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={filter ? 'No students match your search' : 'No students found'}
            description={
              filter ? 'Try a different name, email, or index number.' : 'There are no registered students yet.'
            }
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((student) => (
            <StudentRow key={student.id} student={student} onEdit={() => openEditor(student)} />
          ))}
        </div>
      )}

      <EditCreditsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        student={editing}
        onUpdated={handleUpdated}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

function StudentRow({ student, onEdit }: { student: StudentSummary; onEdit: () => void }) {
  const hasCredits = student.credits != null
  const meetsGate = hasCredits && (student.credits as number) >= REQUIRED_CREDITS

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate">
            {student.fullName}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {student.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              {student.indexNumber ?? '—'}
            </span>
          </div>
          <div className="mt-3">
            <span
              className={
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ' +
                (!hasCredits
                  ? 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700'
                  : meetsGate
                  ? 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900'
                  : 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900')
              }
            >
              <Coins className="h-3 w-3" />
              {hasCredits ? `${student.credits} credits` : 'No credits recorded'}
            </span>
            {hasCredits && !meetsGate && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                below {REQUIRED_CREDITS}-credit thesis requirement
              </span>
            )}
          </div>
        </div>
        <button onClick={onEdit} className="btn-secondary shrink-0">
          <Pencil className="h-4 w-4" />
          Set Credits
        </button>
      </div>
    </div>
  )
}

function LoadingList() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}
