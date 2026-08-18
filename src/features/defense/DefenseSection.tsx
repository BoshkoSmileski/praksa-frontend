import { useEffect, useState } from 'react'
import { Calendar, MapPin, Clock, XCircle, Award, Loader2, CalendarPlus, Send, Hourglass, ClipboardCheck, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { defenseApi } from '@/api/defenseApi'
import { thesisApi } from '@/api/thesisApi'
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
  const [downloadingRecord, setDownloadingRecord] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  // Item #8 — Student Service eligibility verification checkboxes
  const [examsChecked, setExamsChecked] = useState(false)
  const [docsChecked, setDocsChecked] = useState(false)
  const [verifying, setVerifying] = useState(false)
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
  const isService  = user?.role === 'STUDENT_SERVICE'
  // Write-side grading is scoped to the thesis's committee (backend P1 / BUG-13 fix):
  // only a SEATED committee member may record the grade. STUDENT_SERVICE can no longer grade,
  // so it is removed here. The assigned mentor always holds a MENTOR_MEMBER seat, so they can
  // grade. A COMMITTEE-role user is still offered the action, but the backend (the security
  // boundary) rejects them with a 403 if they are not actually seated on this committee.
  const canGrade   = isMentor || user?.role === 'COMMITTEE'

  // Item #8 — before a defense can be requested, Student Service must explicitly verify
  // the defense conditions. This is the ONLY action that moves the thesis out of
  // PENDING_DEFENSE_CHECK into PENDING_DEFENSE_SCHEDULING.
  const isDefenseCheck = thesis.status === 'PENDING_DEFENSE_CHECK'
  const isScheduling   = thesis.status === 'PENDING_DEFENSE_SCHEDULING'
  const canVerifyEligibility = isService && isDefenseCheck
  // Student requests a defense only AFTER eligibility has been verified (post-verification state).
  const canRequest = isStudent && isScheduling && !requested
  // Only STUDENT_SERVICE schedules — after a request, or to reschedule after a cancellation.
  const canSchedule  = isService && (isScheduling || (thesis.status === 'DEFENSE_SCHEDULED' && !defense))
  const canCancel    = (isStudent || isMentor) && defense && !defense.isCancelled
  const canRecordGrade = canGrade && thesis.status === 'DEFENSE_SCHEDULED' && defense && !defense.isCancelled && !result

  const handleVerify = async () => {
    setVerifying(true)
    try {
      await thesisApi.verifyDefenseEligibility(thesis.id, examsChecked, docsChecked)
      toast.success('Defense eligibility confirmed — student can now request a defense')
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setVerifying(false)
    }
  }

  const handleRequest = async () => {
    setRequesting(true)
    try {
      await defenseApi.request(thesis.id)
      setRequested(true)
      toast.success('Defense requested — Student Service will schedule it')
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setRequesting(false)
    }
  }

  const handleDownloadRecord = async () => {
    if (!defense) return
    setDownloadingRecord(true)
    try {
      const blob = await defenseApi.downloadRecordPdf(thesis.id, defense.id)
      // Trigger a browser download from the Blob (same pattern as version/application PDFs).
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zapisnik-odbrana-${defense.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // interceptor
    } finally {
      setDownloadingRecord(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this defense?')) return
    setCancelling(true)
    try {
      await defenseApi.cancel(thesis.id)
      toast.success('Defense cancelled — Student Service can schedule a new one')
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
          {/* ── PENDING_DEFENSE_CHECK: explicit eligibility verification (Item #8) ── */}
          {isDefenseCheck ? (
            <>
              {/* Student: waiting on Student Service to verify eligibility */}
              {isStudent && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Your thesis is awaiting a <strong>defense-eligibility check</strong> by Student
                    Service. Once your exams and documentation are verified, you'll be able to
                    request your defense.
                  </span>
                </div>
              )}

              {/* Student Service: the verification widget */}
              {canVerifyEligibility && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <ClipboardCheck className="h-4 w-4" />
                    Defense Eligibility
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Confirm the student has fulfilled the required defense conditions before scheduling.
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={examsChecked}
                      onChange={(e) => setExamsChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    All required exams completed
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={docsChecked}
                      onChange={(e) => setDocsChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    Documentation complete
                  </label>
                  <button
                    onClick={handleVerify}
                    disabled={!examsChecked || !docsChecked || verifying}
                    className="btn-primary"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                    Confirm Eligibility
                  </button>
                </div>
              )}

              {/* Any other role: just the status */}
              {!isStudent && !isService && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">
                  Awaiting defense-eligibility verification by Student Service.
                </p>
              )}
            </>
          ) : (
            /* ── PENDING_DEFENSE_SCHEDULING (+ reschedule from DEFENSE_SCHEDULED) ── */
            <>
              <p className="text-sm text-gray-500 italic dark:text-gray-400">
                {isScheduling ? 'Eligibility verified — awaiting scheduling' : 'No defense scheduled yet'}
              </p>

              {/* STUDENT: request a defense (only after verification) */}
              {canRequest && (
                <button onClick={handleRequest} disabled={requesting} className="btn-primary">
                  {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Request Defense
                </button>
              )}

              {/* Student has just sent the request this session */}
              {isStudent && isScheduling && requested && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Your defense request has been sent. <strong>Student Service</strong> will schedule
                    the room, date, and time. You will be notified once it is scheduled.
                  </span>
                </div>
              )}

              {/* STUDENT_SERVICE: schedule the requested defense */}
              {canSchedule && (
                <button onClick={() => setScheduleOpen(true)} className="btn-primary">
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Defense
                </button>
              )}
            </>
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
            {/* Defense record ("записник") — only after the defense has been graded.
                Visibility mirrors the backend availability rule; the backend is the
                real authorization boundary and returns 403 for unrelated users. */}
            {result && (
              <button onClick={handleDownloadRecord} disabled={downloadingRecord} className="btn-secondary">
                {downloadingRecord ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                Симни записник
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
