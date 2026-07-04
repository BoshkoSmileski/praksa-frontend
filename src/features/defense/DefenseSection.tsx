import { useEffect, useState } from 'react'
import { Calendar, MapPin, Clock, XCircle, Award, Loader2, CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { defenseApi } from '@/api/defenseApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/date'
import { ScheduleDefenseModal } from './ScheduleDefenseModal'
import { RecordGradeModal } from './RecordGradeModal'
import type { Thesis, Defense, DefenseResult } from '@/types/api'

interface DefenseSectionProps {
  thesis: Thesis
  onThesisChange: () => void
}

export function DefenseSection({ thesis, onThesisChange }: DefenseSectionProps) {
  const [defense, setDefense] = useState<Defense | null>(null)
  const [result, setResult] = useState<DefenseResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [gradeOpen, setGradeOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const user = useAuthStore((s) => s.user)

  const reload = async () => {
    const active = await defenseApi.getActive(thesis.id)
    setDefense(active)
    if (active) {
      const r = await defenseApi.getResult(thesis.id, active.id)
      setResult(r)
    } else {
      setResult(null)
    }
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [thesis.id])

  const isStudent  = user?.role === 'STUDENT'   && thesis.studentId === user.id
  const isMentor   = user?.role === 'MENTOR'    && thesis.mentorId  === user.id
  const isCommittee = user?.role === 'COMMITTEE' || user?.role === 'STUDENT_SERVICE'

  const canSchedule  = isMentor && (thesis.status === 'PENDING_DEFENSE_CHECK' || (thesis.status === 'DEFENSE_SCHEDULED' && !defense))
  const canCancel    = (isStudent || isMentor) && defense && !defense.isCancelled
  const canRecordGrade = isCommittee && thesis.status === 'DEFENSE_SCHEDULED' && defense && !defense.isCancelled && !result

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this defense?')) return
    setCancelling(true)
    try {
      await defenseApi.cancel(thesis.id)
      toast.success('Defense cancelled — mentor can reschedule')
      await reload()
    } catch {
      // interceptor
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">
        <Calendar className="h-5 w-5" />
        Defense
      </h2>

      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : !defense ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 italic dark:text-gray-400">
            No defense scheduled yet
          </p>
          {canSchedule && (
            <button onClick={() => setScheduleOpen(true)} className="btn-primary">
              <CalendarPlus className="h-4 w-4" />
              Schedule Defense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Room:</span>
                <span className="text-gray-700 dark:text-gray-300">{defense.room}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">When:</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDateTime(defense.scheduledAt)}</span>
              </div>
            </div>

            {defense.isCancelled && (
              <div className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300">
                <strong>Cancelled</strong> {defense.cancelledByName && <>by {defense.cancelledByName}</>}
                {defense.cancelledAt && <> on {formatDateTime(defense.cancelledAt)}</>}
              </div>
            )}

            {/* Result display */}
            {result && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 dark:bg-emerald-950/30 dark:border-emerald-900">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Grade: <span className="text-2xl font-bold">{result.grade}</span>
                  </span>
                </div>
                {result.notes && (
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">
                    {result.notes}
                  </p>
                )}
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                  Recorded by {result.recordedByName} · {formatDateTime(result.recordedAt)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {canCancel && (
              <button onClick={handleCancel} disabled={cancelling} className="btn-secondary">
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-red-500" />}
                Cancel Defense
              </button>
            )}
            {canRecordGrade && (
              <button onClick={() => setGradeOpen(true)} className="btn-primary">
                <Award className="h-4 w-4" />
                Record Grade
              </button>
            )}
          </div>
        </div>
      )}

      <ScheduleDefenseModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        thesisId={thesis.id}
        onScheduled={async () => {
          await reload()
          onThesisChange()
        }}
      />

      {defense && (
        <RecordGradeModal
          open={gradeOpen}
          onClose={() => setGradeOpen(false)}
          thesisId={thesis.id}
          defenseId={defense.id}
          onRecorded={async () => {
            await reload()
            onThesisChange()
          }}
        />
      )}
    </div>
  )
}
