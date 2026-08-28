import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, MapPin, Clock, Award, XCircle, User as UserIcon, Hourglass } from 'lucide-react'
import { thesisApi } from '@/api/thesisApi'
import { defenseApi } from '@/api/defenseApi'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/utils/date'
import type { Thesis, Defense, DefenseResult } from '@/types/api'

type DefenseInfo = {
  defense: Defense | null
  result: DefenseResult | null
  hasPendingRequest: boolean
}

export function DefensesPage() {
  const user = useAuthStore((s) => s.user)
  const isService = user?.role === 'STUDENT_SERVICE'
  const [theses, setTheses] = useState<Thesis[]>([])
  const [defenses, setDefenses] = useState<Record<string, DefenseInfo>>({})
  const [loading, setLoading] = useState(true)

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
              let hasPendingRequest = false
              if (!defense && (t.status === 'PENDING_DEFENSE_SCHEDULING' || t.status === 'DEFENSE_SCHEDULED')) {
                try {
                  const requests = await defenseApi.getRequests(t.id)
                  hasPendingRequest = requests.some((r) => r.status === 'PENDING')
                } catch {
                  // ignore — badge just won't reflect a pending proposal
                }
              }
              return [t.id, { defense, result, hasPendingRequest }] as const
            } catch {
              return [t.id, { defense: null, result: null, hasPendingRequest: false }] as const
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
  }, [user?.id])

  const description =
    user?.role === 'STUDENT'         ? 'Вашите претстојни и минати одбрани' :
    user?.role === 'MENTOR'          ? 'Одбрани за дипломски работи каде сте ментор или член на комисија' :
    user?.role === 'COMMITTEE'       ? 'Одбрани што можете да ги оцените' :
    user?.role === 'STUDENT_SERVICE' ? 'Сите одбрани во системот' :
    'Преглед на одбрани'

  return (
    <div>
      <PageHeader title="Одбрани" description={description} />

      {loading ? (
        <LoadingList />
      ) : theses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="Нема одбрани за прикажување"
            description="Дипломските работи стануваат видливи тука откако ќе стигнат до фазата на одбрана."
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────

function DefenseCard({
  thesis,
  info,
  isService,
}: {
  thesis: Thesis
  info: DefenseInfo | undefined
  isService: boolean
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
                Откажана
              </span>
            )}
            {result && result.grade === 5 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-200">
                <Award className="h-3 w-3" />
                Оценка: {result.grade} — Не положена
              </span>
            ) : result ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                <Award className="h-3 w-3" />
                Оценка: {result.grade}
              </span>
            ) : null}
            {awaitingScheduling && info?.hasPendingRequest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <Hourglass className="h-3 w-3" />
                Чека одобрување
              </span>
            )}
            {awaitingScheduling && !info?.hasPendingRequest && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Условите се потврдени — сè уште нема предложен термин
              </span>
            )}
            {awaitingEligibility && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Чека проверка на условите
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
                Ментор: {thesis.mentorName}
              </span>
            )}
          </div>

          {/* When the thesis is awaiting scheduling, updatedAt is the eligibility-verification time */}
          {awaitingScheduling && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Условите се потврдени на {formatDateTime(thesis.updatedAt)}
            </p>
          )}

          {/* STUDENT_SERVICE: review the proposed term on the thesis detail page */}
          {isService && awaitingScheduling && info?.hasPendingRequest && (
            <p className="mt-3 text-xs text-brand-600 dark:text-brand-400">
              Отворете ја дипломската работа за да го разгледате и одлучите за предложениот термин.
            </p>
          )}

          {defense && (
            <div className="mt-3 grid gap-1 sm:grid-cols-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatDateTime(defense.scheduledAt)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400" />
                Просторија {defense.room}
              </div>
            </div>
          )}

          {defense?.isCancelled && defense.cancelledByName && (
            <p className="mt-2 text-xs text-red-700 dark:text-red-400">
              Откажана од {defense.cancelledByName}
              {defense.cancelledAt && <> на {formatDateTime(defense.cancelledAt)}</>}
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
