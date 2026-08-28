import { useEffect, useState } from 'react'
import { Calendar, MapPin, Clock, XCircle, Award, Loader2, CalendarPlus, Hourglass, ClipboardCheck, FileDown, CheckCircle2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { defenseApi } from '@/api/defenseApi'
import { thesisApi } from '@/api/thesisApi'
import { committeeApi } from '@/api/committeeApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/date'
import { ProposeDefenseModal } from './ProposeDefenseModal'
import { RejectDefenseRequestModal } from './RejectDefenseRequestModal'
import { RecordGradeModal } from './RecordGradeModal'
import type { Thesis, Defense, DefenseRequest, DefenseResult, CommitteeMember } from '@/types/api'

interface DefenseSectionProps {
  thesis: Thesis
  onThesisChange: () => void
}

export function DefenseSection({ thesis, onThesisChange }: DefenseSectionProps) {
  const [defense, setDefense] = useState<Defense | null>(null)
  const [result, setResult] = useState<DefenseResult | null>(null)
  const [requests, setRequests] = useState<DefenseRequest[]>([])
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [proposeOpen, setProposeOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [gradeOpen, setGradeOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [downloadingRecord, setDownloadingRecord] = useState(false)
  const [deciding, setDeciding] = useState(false)
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
    try {
      setRequests(await defenseApi.getRequests(thesis.id))
    } catch {
      setRequests([])
    }
    try {
      setCommitteeMembers(await committeeApi.list(thesis.id))
    } catch {
      setCommitteeMembers([])
    }
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [thesis.id])

  const isStudent  = user?.role === 'STUDENT'   && thesis.studentId === user.id
  const isMentor   = user?.role === 'MENTOR'    && thesis.mentorId  === user.id
  const isService  = user?.role === 'STUDENT_SERVICE'
  // Official faculty procedure: a committee may have an optional 4th, external, NON-VOTING
  // member (up to 1). If the current user holds that specific seat, they must never be offered
  // the grading action — the backend rejects the attempt regardless, but the UI should not even
  // suggest it is possible.
  const myCommitteeSeat = committeeMembers.find((m) => m.professorId === user?.id)
  const isExternalNonVotingMember = !!myCommitteeSeat?.externalNonVoting
  // Write-side grading is scoped to the thesis's committee (backend P1 / BUG-13 fix):
  // only a SEATED, VOTING committee member may record the grade. STUDENT_SERVICE can no longer
  // grade, so it is removed here. The assigned mentor always holds a voting MENTOR_MEMBER seat,
  // so they can grade. A COMMITTEE-role user is still offered the action, but the backend (the
  // security boundary) rejects them with a 403 if they are not actually seated on this
  // committee, or if their seat is the external non-voting one.
  const canGrade   = (isMentor || user?.role === 'COMMITTEE') && !isExternalNonVotingMember

  // Item #8 — before a defense can be requested, Student Service must explicitly verify
  // the defense conditions. This is the ONLY action that moves the thesis out of
  // PENDING_DEFENSE_CHECK into PENDING_DEFENSE_SCHEDULING.
  const isDefenseCheck = thesis.status === 'PENDING_DEFENSE_CHECK'
  const isScheduling   = thesis.status === 'PENDING_DEFENSE_SCHEDULING'
  const canVerifyEligibility = isService && isDefenseCheck

  // A proposal may be submitted once eligibility has been verified, OR again after a
  // previously scheduled defense was cancelled (status stays DEFENSE_SCHEDULED but there is
  // no active Defense) — mirrors DefenseServiceImpl.requireEligibleForProposal exactly.
  const eligibleForProposal = isScheduling || (thesis.status === 'DEFENSE_SCHEDULED' && !defense)
  const pendingRequest = requests.find((r) => r.status === 'PENDING') ?? null
  const latestRequest = requests[0] ?? null

  // Official faculty procedure: a defense may only be requested at least 14 full days
  // after the formal thesis application was submitted. The backend is authoritative
  // (DefenseServiceImpl#createDefenseRequest) — this is a UX-only precheck so the student
  // sees a clear waiting notice instead of a submit-then-fail round trip.
  const APPLICATION_WAIT_DAYS = 14
  const applicationEligibleAt = thesis.applicationSubmittedAt
    ? new Date(new Date(thesis.applicationSubmittedAt).getTime() + APPLICATION_WAIT_DAYS * 24 * 60 * 60 * 1000)
    : null
  const applicationWaitSatisfied = applicationEligibleAt !== null && applicationEligibleAt.getTime() <= Date.now()
  const daysUntilEligible = applicationEligibleAt
    ? Math.max(1, Math.ceil((applicationEligibleAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null

  const canPropose = isStudent && eligibleForProposal && !pendingRequest && applicationWaitSatisfied
  const canDecide = isService && !!pendingRequest
  const canCancel    = (isStudent || isMentor) && defense && !defense.isCancelled
  const canRecordGrade = canGrade && thesis.status === 'DEFENSE_SCHEDULED' && defense && !defense.isCancelled && !result

  const handleVerify = async () => {
    setVerifying(true)
    try {
      await thesisApi.verifyDefenseEligibility(thesis.id, examsChecked, docsChecked)
      toast.success('Условите за одбрана се потврдени — студентот сега може да предложи термин за одбрана')
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setVerifying(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Го одобрувате овој предлог за одбрана? Ова ќе ја закаже одбраната.')) return
    setDeciding(true)
    try {
      await defenseApi.decideRequest(thesis.id, true)
      toast.success('Предлогот за одбрана е одобрен — одбраната е закажана')
      await reload()
      onThesisChange()
    } catch {
      // interceptor — a room/date conflict discovered at approval time surfaces here;
      // reload so the (now-rejected) request state is reflected.
      await reload()
    } finally {
      setDeciding(false)
    }
  }

  const handleReject = async (reason: string) => {
    setDeciding(true)
    try {
      await defenseApi.decideRequest(thesis.id, false, reason)
      toast.success('Предлогот за одбрана е одбиен')
      setRejectOpen(false)
      await reload()
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setDeciding(false)
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
    if (!confirm('Дали сте сигурни дека сакате да ја откажете оваа одбрана?')) return
    setCancelling(true)
    try {
      await defenseApi.cancel(thesis.id)
      toast.success('Одбраната е откажана — можете да предложите нов термин')
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
        Одбрана
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
                    Вашата дипломска работа чека <strong>проверка на условите за одбрана</strong> од
                    Студентската служба. Откако ќе бидат потврдени вашите испити и документација,
                    ќе можете да предложите термин за одбрана.
                  </span>
                </div>
              )}

              {/* Student Service: the verification widget */}
              {canVerifyEligibility && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <ClipboardCheck className="h-4 w-4" />
                    Услови за одбрана
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Потврдете дека студентот ги исполнил потребните услови за одбрана пред закажувањето.
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={examsChecked}
                      onChange={(e) => setExamsChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    Сите потребни испити се положени
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={docsChecked}
                      onChange={(e) => setDocsChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    Документацијата е комплетна
                  </label>
                  <button
                    onClick={handleVerify}
                    disabled={!examsChecked || !docsChecked || verifying}
                    className="btn-primary"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                    Потврди ги условите
                  </button>
                </div>
              )}

              {/* Any other role: just the status */}
              {!isStudent && !isService && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">
                  Чека проверка на условите за одбрана од Студентската служба.
                </p>
              )}
            </>
          ) : (
            /* ── Student proposes room/date/time; Student Service reviews it ── */
            <>
              {!pendingRequest && !latestRequest && (
                <p className="text-sm text-gray-500 italic dark:text-gray-400">
                  {isScheduling ? 'Условите се потврдени — сè уште нема предложен термин за одбрана' : 'Сè уште нема закажана одбрана'}
                </p>
              )}

              {/* PENDING proposal — shown to everyone, with the decision widget for Student Service */}
              {pendingRequest && (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                    <Hourglass className="h-4 w-4" />
                    Чека одобрување
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{pendingRequest.room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{formatDateTime(pendingRequest.scheduledAt)}</span>
                    </div>
                  </div>
                  {isService && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Предложено од {pendingRequest.requestedByName ?? thesis.studentName} на{' '}
                      {formatDateTime(pendingRequest.createdAt)}
                    </p>
                  )}
                  {isStudent && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Вашиот предлог чека одлука од Студентската служба.
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

              {/* No pending request, but the latest one was rejected — show the reason */}
              {!pendingRequest && latestRequest && latestRequest.status === 'REJECTED' && (
                <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-900 dark:text-red-200">
                    <XCircle className="h-4 w-4" />
                    Одбиено
                  </div>
                  {latestRequest.reason && (
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <span className="font-medium">Причина:</span> {latestRequest.reason}
                    </p>
                  )}
                </div>
              )}

              {/* STUDENT: 14-day post-application waiting period not yet satisfied */}
              {isStudent && eligibleForProposal && !pendingRequest && !applicationWaitSatisfied && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {applicationEligibleAt
                      ? <>Барањето за одбрана може да се поднесе по истекот на 14 дена од
                          поднесувањето на пријавата — можете да предложите термин на{' '}
                          <strong>{formatDateTime(applicationEligibleAt.toISOString())}</strong>
                          {daysUntilEligible != null && <> (уште {daysUntilEligible} ден(а)).</>}</>
                      : 'Датумот на поднесување на пријавата не е достапен — контактирајте ја студентската служба.'}
                  </span>
                </div>
              )}

              {/* STUDENT: propose a (new) defense term */}
              {canPropose && (
                <button onClick={() => setProposeOpen(true)} className="btn-primary">
                  <CalendarPlus className="h-4 w-4" />
                  Предложи нов термин
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
                <span className="font-medium text-gray-900 dark:text-gray-100">Просторија:</span>
                <span className="text-gray-700 dark:text-gray-300">{defense.room}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Кога:</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDateTime(defense.scheduledAt)}</span>
              </div>
            </div>

            {defense.isCancelled && (
              <div className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300">
                <strong>Откажана</strong> {defense.cancelledByName && <>од {defense.cancelledByName}</>}
                {defense.cancelledAt && <> на {formatDateTime(defense.cancelledAt)}</>}
              </div>
            )}

            {/* Result display — grade 5 means the defense was NOT passed (official faculty
                rule); it must never look like a successful/archived result. */}
            {result && result.grade === 5 ? (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/30 dark:border-red-900">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-red-700 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-200">
                    Оценка: <span className="text-2xl font-bold">{result.grade}</span> — Одбраната не е положена
                  </span>
                </div>
                {result.notes && (
                  <p className="mt-2 text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                    {result.notes}
                  </p>
                )}
                <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                  Оваа дипломска работа НЕ е архивирана. Студентот може да ја преработи темата или
                  да поднесе нова пријава за дипломска работа.
                </p>
                <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                  Внесено од {result.recordedByName} · {formatDateTime(result.recordedAt)}
                </p>
              </div>
            ) : result ? (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 dark:bg-emerald-950/30 dark:border-emerald-900">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    Оценка: <span className="text-2xl font-bold">{result.grade}</span>
                  </span>
                </div>
                {result.notes && (
                  <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">
                    {result.notes}
                  </p>
                )}
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                  Внесено од {result.recordedByName} · {formatDateTime(result.recordedAt)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            {canCancel && (
              <button onClick={handleCancel} disabled={cancelling} className="btn-secondary">
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-red-500" />}
                Откажи одбрана
              </button>
            )}
            {canRecordGrade && (
              <button onClick={() => setGradeOpen(true)} className="btn-primary">
                <Award className="h-4 w-4" />
                Внеси оценка
              </button>
            )}
            {/* The external non-voting member holds a real seat but may never grade — make
                that explicit instead of silently hiding the action with no explanation. */}
            {!canRecordGrade && isExternalNonVotingMember && thesis.status === 'DEFENSE_SCHEDULED'
              && defense && !defense.isCancelled && !result && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs italic text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <Ban className="h-3.5 w-3.5" />
                Надворешен член – нема право на оценување
              </span>
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

      <ProposeDefenseModal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        thesisId={thesis.id}
        onProposed={async () => {
          await reload()
          onThesisChange()
        }}
      />

      <RejectDefenseRequestModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        submitting={deciding}
        onConfirm={handleReject}
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
