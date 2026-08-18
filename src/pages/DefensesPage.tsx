import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, MapPin, Clock, Award, XCircle, User as UserIcon, CalendarPlus } from 'lucide-react'
import { thesisApi } from '@/api/thesisApi'
import { defenseApi } from '@/api/defenseApi'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/utils/date'
import { ScheduleDefenseModal } from '@/features/defense/ScheduleDefenseModal'
import type { Thesis, Defense, DefenseResult } from '@/types/api'

type DefenseInfo = {
  defense: Defense | null
  result: DefenseResult | null
}

export function DefensesPage() {
  const user = useAuthStore((s) => s.user)
  const isService = user?.role === 'STUDENT_SERVICE'
  const [theses, setTheses] = useState<Thesis[]>([])
  const [defenses, setDefenses] = useState<Record<string, DefenseInfo>>({})
  const [loading, setLoading] = useState(true)
  const [scheduleFor, setScheduleFor] = useState<Thesis | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    thesisApi
      .getDefenses()
      .then(async (list) => {
        if (cancelled) return
        setTheses(list)
        const results = await Promise.all(
          list.map(async (t) => {
            // Fetch per-thesis defense info defensively: if a single thesis read is
            // forbidden (403) or otherwise fails, degrade that one card to "no info"
            // instead of failing the whole list. The interceptor keeps the session on 403.
            try {
              const defense = await defenseApi.getActive(t.id)
              const result = defense ? await defenseApi.getResult(t.id, defense.id) : null
              return [t.id, { defense, result }] as const
            } catch {
              return [t.id, { defense: null, result: null }] as const
            }
          }),
        )
        if (cancelled) return
        setDefenses(Object.fromEntries(results))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [user?.id, reloadKey])

  const description =
    user?.role === 'STUDENT'         ? 'Your upcoming and past defenses' :
    user?.role === 'MENTOR'          ? 'Defenses for theses you mentor or serve on' :
    user?.role === 'COMMITTEE'       ? 'Defenses you may grade' :
    user?.role === 'STUDENT_SERVICE' ? 'All defenses in the system' :
    'Defense overview'

  return (
    <div>
      <PageHeader title="Defenses" description={description} />

      {loading ? (
        <LoadingList />
      ) : theses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="No defenses to show"
            description="Theses become visible here once they reach the defense stage."
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {theses.map((thesis) => (
            <DefenseCard
              key={thesis.id}
              thesis={thesis}
              info={defenses[thesis.id]}
              isService={isService}
              onSchedule={setScheduleFor}
            />
          ))}
        </div>
      )}

      {scheduleFor && (
        <ScheduleDefenseModal
          open={!!scheduleFor}
          onClose={() => setScheduleFor(null)}
          thesisId={scheduleFor.id}
          onScheduled={() => {
            setScheduleFor(null)
            setReloadKey((k) => k + 1)
          }}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────

function DefenseCard({
  thesis,
  info,
  isService,
  onSchedule,
}: {
  thesis: Thesis
  info: DefenseInfo | undefined
  isService: boolean
  onSchedule: (t: Thesis) => void
}) {
  const defense = info?.defense ?? null
  const result = info?.result ?? null

  // Eligibility has been verified (Item #8) and the defense is waiting to be scheduled.
  const awaitingScheduling = thesis.status === 'PENDING_DEFENSE_SCHEDULING'
  // Awaiting the explicit Student Service defense-eligibility check (Item #8).
  const awaitingEligibility = thesis.status === 'PENDING_DEFENSE_CHECK'

  return (
    <Link
      to={`/theses/${thesis.id}`}
      className="card group block p-5 hover:ring-2 hover:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={thesis.status} />
            {defense?.isCancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
                <XCircle className="h-3 w-3" />
                Cancelled
              </span>
            )}
            {result && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Award className="h-3 w-3" />
                Grade: {result.grade}
              </span>
            )}
            {awaitingScheduling && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Eligibility verified — awaiting scheduling
              </span>
            )}
            {awaitingEligibility && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Awaiting eligibility check
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
          </div>

          {/* When the thesis is awaiting scheduling, updatedAt is the eligibility-verification time */}
          {awaitingScheduling && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Eligibility verified {formatDateTime(thesis.updatedAt)}
            </p>
          )}

          {/* STUDENT_SERVICE: schedule the requested defense right from the list */}
          {isService && awaitingScheduling && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSchedule(thesis)
              }}
              className="btn-primary mt-3"
            >
              <CalendarPlus className="h-4 w-4" />
              Schedule Defense
            </button>
          )}

          {defense && (
            <div className="mt-3 grid gap-1 sm:grid-cols-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatDateTime(defense.scheduledAt)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400" />
                Room {defense.room}
              </div>
            </div>
          )}

          {defense?.isCancelled && defense.cancelledByName && (
            <p className="mt-2 text-xs text-red-700 dark:text-red-400">
              Cancelled by {defense.cancelledByName}
              {defense.cancelledAt && <> on {formatDateTime(defense.cancelledAt)}</>}
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
