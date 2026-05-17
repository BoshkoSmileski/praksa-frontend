import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus, ArrowRight, User } from 'lucide-react'
import { thesisApi } from '@/api/thesisApi'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/date'
import type { Thesis } from '@/types/api'

export function ThesesListPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  // Standard data-fetching pattern with useEffect.
  // (We could extract this into a useTheses() hook later — for one call it's not worth it yet.)
  useEffect(() => {
    thesisApi
      .getMy()
      .then(setTheses)
      .catch(() => {
        // Toast already shown by axios interceptor
      })
      .finally(() => setLoading(false))
  }, [])

  const canCreate = user?.role === 'STUDENT'

  return (
    <div>
      <PageHeader
        title="Theses"
        description={
          user?.role === 'STUDENT'
            ? 'Your thesis applications'
            : user?.role === 'MENTOR'
            ? 'Theses assigned to you'
            : 'All theses in the system'
        }
        action={
          canCreate && (
            <button onClick={() => navigate('/theses/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              New Thesis
            </button>
          )
        }
      />

      {loading ? (
        <LoadingList />
      ) : theses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No theses yet"
            description={
              canCreate
                ? 'Start your thesis journey by creating your first application.'
                : 'No theses are currently visible to you.'
            }
            action={
              canCreate && (
                <button onClick={() => navigate('/theses/new')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Create Thesis
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {theses.map((thesis) => (
            <ThesisCard key={thesis.id} thesis={thesis} />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Sub-components — declared after the main one keeps the file readable
// ────────────────────────────────────────────────────────────────

function ThesisCard({ thesis }: { thesis: Thesis }) {
  return (
    <Link
      to={`/theses/${thesis.id}`}
      className="card group block p-5 hover:ring-2 hover:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={thesis.status} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Created {formatDate(thesis.createdAt)}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate group-hover:text-brand-600">
            {thesis.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {thesis.studentName}
            </span>
            {thesis.mentorName && (
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">·</span>
                Mentor: {thesis.mentorName}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </Link>
  )
}

function LoadingList() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
