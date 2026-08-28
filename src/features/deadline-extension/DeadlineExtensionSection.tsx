import { useEffect, useState } from 'react'
import { CalendarClock, Hourglass, CheckCircle2, Ban, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/date'
import { DeadlineExtensionModal } from './DeadlineExtensionModal'
import { RejectDeadlineExtensionModal } from './RejectDeadlineExtensionModal'
import type { Thesis, DeadlineExtensionRequest } from '@/types/api'

interface DeadlineExtensionSectionProps {
  thesis: Thesis
  onThesisChange: () => void
}

/**
 * Official faculty procedure: a student may request an extension of the defense deadline, for
 * a maximum of 15 additional days, with a written explanation. This is a purely administrative
 * sub-process — it never changes the thesis's workflow status. Renders nothing until the thesis
 * has a defense deadline (i.e. Student Service has verified defense eligibility).
 */
export function DeadlineExtensionSection({ thesis, onThesisChange }: DeadlineExtensionSectionProps) {
  const [requests, setRequests] = useState<DeadlineExtensionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestOpen, setRequestOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const user = useAuthStore((s) => s.user)

  const reload = async () => {
    try {
      setRequests(await thesisApi.getDeadlineExtensionRequests(thesis.id))
    } catch {
      setRequests([])
    }
  }

  useEffect(() => {
    if (!thesis.defenseDeadline) {
      setLoading(false)
      return
    }
    reload().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesis.id, thesis.defenseDeadline])

  // Nothing to show until Student Service has verified defense eligibility and a deadline exists.
  if (!thesis.defenseDeadline) return null

  const isStudent = user?.role === 'STUDENT' && thesis.studentId === user.id
  const isService = user?.role === 'STUDENT_SERVICE'

  const pendingRequest = requests.find((r) => r.status === 'PENDING') ?? null
  const latestRequest = requests[0] ?? null
  // Conservative design rule (matches the backend): at most one APPROVED extension per thesis.
  const hasApprovedExtension = requests.some((r) => r.status === 'APPROVED')

  const canRequest = isStudent && !pendingRequest && !hasApprovedExtension
  const canDecide = isService && !!pendingRequest

  const handleApprove = async () => {
    if (!confirm('Го одобрувате ова барање за продолжување на рокот? Рокот ќе биде продолжен веднаш.')) return
    setDeciding(true)
    try {
      await thesisApi.decideDeadlineExtension(thesis.id, true)
      toast.success('Продолжувањето на рокот е одобрено')
      await reload()
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setDeciding(false)
    }
  }

  const handleReject = async (reason: string) => {
    setDeciding(true)
    try {
      await thesisApi.decideDeadlineExtension(thesis.id, false, reason)
      toast.success('Продолжувањето на рокот е одбиено')
      setRejectOpen(false)
      await reload()
    } catch {
      // interceptor
    } finally {
      setDeciding(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">
        <CalendarClock className="h-5 w-5" />
        Рок за одбрана
      </h2>

      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">Тековен рок:</span>
            <span className="text-gray-700 dark:text-gray-300">{formatDateTime(thesis.defenseDeadline)}</span>
          </div>

          {/* PENDING request */}
          {pendingRequest && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                <Hourglass className="h-4 w-4" />
                Чека одобрување — {pendingRequest.requestedDays} {pendingRequest.requestedDays === 1 ? 'дополнителен ден' : 'дополнителни денови'}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {pendingRequest.reason}
              </p>
              {isService && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Побарано од {pendingRequest.requestedByName ?? thesis.studentName} на{' '}
                  {formatDateTime(pendingRequest.createdAt)}
                </p>
              )}
              {isStudent && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Вашето барање чека одлука од Студентската служба.
                </p>
              )}

              {canDecide && (
                <div className="flex gap-2 pt-1">
                  <button onClick={handleApprove} disabled={deciding} className="btn-primary">
                    {deciding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Одобри
                  </button>
                  <button onClick={() => setRejectOpen(true)} disabled={deciding} className="btn-secondary">
                    <Ban className="h-4 w-4 text-red-500" />
                    Одбиј
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Most recent decided request — approved or rejected */}
          {!pendingRequest && latestRequest && latestRequest.status === 'APPROVED' && (
            <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Продолжувањето е одобрено (+{latestRequest.requestedDays} {latestRequest.requestedDays === 1 ? 'ден' : 'дена'})
              </div>
              {latestRequest.previousDeadline && latestRequest.newDeadline && (
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  {formatDateTime(latestRequest.previousDeadline)} → {formatDateTime(latestRequest.newDeadline)}
                </p>
              )}
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Одлучено од {latestRequest.decidedByName ?? 'Студентската служба'}
                {latestRequest.decidedAt && <> · {formatDateTime(latestRequest.decidedAt)}</>}
              </p>
            </div>
          )}

          {!pendingRequest && latestRequest && latestRequest.status === 'REJECTED' && (
            <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-200">
                <XCircle className="h-4 w-4" />
                Одбиено
              </div>
              {latestRequest.decisionReason && (
                <p className="text-sm text-red-800 dark:text-red-300">
                  <span className="font-medium">Причина:</span> {latestRequest.decisionReason}
                </p>
              )}
              <p className="text-xs text-red-700 dark:text-red-400">
                Рокот за одбрана останува непроменет.
              </p>
            </div>
          )}

          {isStudent && hasApprovedExtension && !pendingRequest && (
            <p className="text-xs text-gray-500 italic dark:text-gray-400">
              Веќе е искористено продолжување за оваа дипломска работа; дополнителни продолжувања не се дозволени.
            </p>
          )}

          {/* STUDENT: request an extension */}
          {canRequest && (
            <button onClick={() => setRequestOpen(true)} className="btn-secondary">
              <CalendarClock className="h-4 w-4" />
              Побарај продолжување на рокот
            </button>
          )}
        </div>
      )}

      <DeadlineExtensionModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        thesisId={thesis.id}
        onRequested={reload}
      />

      <RejectDeadlineExtensionModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        submitting={deciding}
        onConfirm={handleReject}
      />
    </div>
  )
}
