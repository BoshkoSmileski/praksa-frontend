import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus, ArrowRight, User, Hash, Search, X } from 'lucide-react'
import { toast } from 'sonner'
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
  // Client-side text filter applied to title + registration number
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

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
  const isArchive = user?.role === 'ARCHIVE'

  // Direct lookup by registration number — useful for archive users who paste a known number.
  // If found, navigate straight to detail. Falls back to client-side filter otherwise.
  const handleRegistrationSearch = async (e: FormEvent) => {
    e.preventDefault()
    const q = filter.trim()
    if (!q) return
    // Only attempt exact lookup if the input looks like a registration number
    if (/^DT-\d{4}-\d+$/i.test(q)) {
      try {
        const found = await thesisApi.findByRegistrationNumber(q.toUpperCase())
        navigate(`/theses/${found.id}`)
        return
      } catch {
        toast.error(`Не е пронајдена дипломска работа со регистарски број ${q}`)
      }
    }
    // For anything else we just rely on the client-side filter below
  }

  // Client-side filtering — matches title or registration number (case-insensitive)
  const visible = filter.trim()
    ? theses.filter((t) => {
        const q = filter.trim().toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          (t.archiveRegistrationNumber?.toLowerCase().includes(q) ?? false)
        )
      })
    : theses

  return (
    <div>
      <PageHeader
        title="Дипломски работи"
        description={
          user?.role === 'STUDENT' ? 'Вашите пријави за дипломска работа'
          : user?.role === 'MENTOR' ? 'Дипломски работи доделени на вас'
          : user?.role === 'ARCHIVE' ? 'Дипломски работи што чекаат валидација и архивирани записи'
          : 'Сите дипломски работи во системот'
        }
        action={
          canCreate && (
            <button onClick={() => navigate('/theses/new')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Нова дипломска работа
            </button>
          )
        }
      />

      {/* Search bar — visible for everyone but particularly useful for ARCHIVE role */}
      {(isArchive || theses.length > 5) && (
        <form onSubmit={handleRegistrationSearch} className="card p-3 mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400 ml-1 shrink-0" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={
              isArchive
                ? 'Пребарајте по регистарски број (DT-2026-0001) или наслов...'
                : 'Филтрирај по наслов или регистарски број...'
            }
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Исчисти"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      )}

      {loading ? (
        <LoadingList />
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={filter ? 'Нема дипломски работи што одговараат на филтерот' : 'Сè уште нема дипломски работи'}
            description={
              filter
                ? 'Обидете се со друг збор за пребарување.'
                : canCreate
                ? 'Започнете со изработка на дипломска работа со креирање на првата пријава.'
                : 'Моментално нема достапни дипломски работи за вас.'
            }
            action={
              canCreate && !filter && (
                <button onClick={() => navigate('/theses/new')} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Креирај дипломска работа
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((thesis) => (
            <ThesisCard key={thesis.id} thesis={thesis} />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

function ThesisCard({ thesis }: { thesis: Thesis }) {
  return (
    <Link
      to={`/theses/${thesis.id}`}
      className="card group block p-5 hover:ring-2 hover:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={thesis.status} />
            {/* Registration number badge — only present once archived */}
            {thesis.archiveRegistrationNumber && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900">
                <Hash className="h-3 w-3" />
                {thesis.archiveRegistrationNumber}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Креирана на {formatDate(thesis.createdAt)}
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
                Ментор: {thesis.mentorName}
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
