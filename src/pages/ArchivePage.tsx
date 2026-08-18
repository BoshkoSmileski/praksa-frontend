import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, ArrowRight, Hash, Search, X, User as UserIcon, Inbox, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime } from '@/utils/date'
import type { Thesis } from '@/types/api'

export function ArchivePage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    thesisApi
      .getMy()
      .then(setTheses)
      .finally(() => setLoading(false))
  }, [])

  // Split into two lists: pending validation queue vs. archived records.
  const { pending, archived } = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const match = (t: Thesis) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.archiveRegistrationNumber?.toLowerCase().includes(q) ?? false) ||
      t.studentName.toLowerCase().includes(q)

    return {
      pending: theses.filter((t) => t.status === 'PENDING_ARCHIVE_VALIDATION').filter(match),
      archived: theses.filter((t) => t.status === 'ARCHIVED').filter(match),
    }
  }, [theses, filter])

  // Direct lookup by registration number — the same pattern ThesesListPage uses.
  const handleRegistrationSearch = async (e: FormEvent) => {
    e.preventDefault()
    const q = filter.trim()
    if (!q) return
    if (/^DT-\d{4}-\d+$/i.test(q)) {
      try {
        const found = await thesisApi.findByRegistrationNumber(q.toUpperCase())
        navigate(`/theses/${found.id}`)
        return
      } catch {
        toast.error(`No thesis found with registration number ${q}`)
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Archive"
        description="Validation queue and archived thesis records"
      />

      <form onSubmit={handleRegistrationSearch} className="card p-3 mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400 ml-1 shrink-0" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by registration number (DT-2026-0001), title, or student..."
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
      </form>

      {loading ? (
        <LoadingList />
      ) : (
        <div className="space-y-8">
          {/* Validation queue */}
          <section>
            <SectionHeader
              icon={<Inbox className="h-5 w-5" />}
              title="Pending Validation"
              count={pending.length}
              hint="Applications awaiting your archive review"
            />
            {pending.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={<FileCheck className="h-8 w-8" />}
                  title="Nothing in the queue"
                  description="New applications will appear here for archive validation."
                />
              </div>
            ) : (
              <div className="grid gap-3">
                {pending.map((t) => (
                  <PendingCard key={t.id} thesis={t} />
                ))}
              </div>
            )}
          </section>

          {/* Archived records */}
          <section>
            <SectionHeader
              icon={<Archive className="h-5 w-5" />}
              title="Archived Records"
              count={archived.length}
              hint="Defended and archived theses"
            />
            {archived.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={<Archive className="h-8 w-8" />}
                  title="No archived theses yet"
                  description={filter ? 'Try a different search term.' : 'Archived records appear here after a defense is graded.'}
                />
              </div>
            ) : (
              <div className="grid gap-3">
                {archived.map((t) => (
                  <ArchivedCard key={t.id} thesis={t} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
  hint,
}: {
  icon: React.ReactNode
  title: string
  count: number
  hint?: string
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">({count})</span>
      </div>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}

function PendingCard({ thesis }: { thesis: Thesis }) {
  return (
    <Link
      to={`/theses/${thesis.id}`}
      className="card group block p-5 hover:ring-2 hover:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={thesis.status} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Submitted {formatDate(thesis.updatedAt)}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate group-hover:text-brand-600">
            {thesis.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
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

function ArchivedCard({ thesis }: { thesis: Thesis }) {
  return (
    <Link
      to={`/theses/${thesis.id}`}
      className="card group block p-5 hover:ring-2 hover:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={thesis.status} />
            {thesis.archiveRegistrationNumber && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900">
                <Hash className="h-3 w-3" />
                {thesis.archiveRegistrationNumber}
              </span>
            )}
            {thesis.archiveDate && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Archived {formatDateTime(thesis.archiveDate)}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate group-hover:text-brand-600">
            {thesis.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              {thesis.studentName}
            </span>
            {thesis.mentorName && (
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">·</span>
                Mentor: {thesis.mentorName}
              </span>
            )}
            {thesis.archivedByName && (
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">·</span>
                Archived by: {thesis.archivedByName}
              </span>
            )}
          </div>
          {thesis.archiveNotes && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {thesis.archiveNotes}
            </p>
          )}
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
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
