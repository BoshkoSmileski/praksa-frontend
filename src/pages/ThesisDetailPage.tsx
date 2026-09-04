import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, User, MessageSquare, CheckCircle, XCircle, Loader2, History, UserPlus, RefreshCw, AlertCircle, AlertTriangle, Archive as ArchiveIcon, Hash, FileText, Download, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { MentorPickerModal } from '@/features/mentor-picker/MentorPickerModal'
import { ReviseProposalModal } from '@/features/revise-proposal/ReviseProposalModal'
import { RejectValidationModal } from '@/features/validation/RejectValidationModal'
import { MentorDecisionModal, type MentorDecisionMode } from '@/features/mentor-decision/MentorDecisionModal'
import { VersionsSection } from '@/features/versions/VersionsSection'
import { CommitteeSection } from '@/features/committee/CommitteeSection'
import { DefenseSection } from '@/features/defense/DefenseSection'
import { DeadlineExtensionSection } from '@/features/deadline-extension/DeadlineExtensionSection'
import { formatDate, formatDateTime } from '@/utils/date'
import type { Thesis, ThesisStatusHistory } from '@/types/api'

export function ThesisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [thesis, setThesis] = useState<Thesis | null>(null)
  const [history, setHistory] = useState<ThesisStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  // HTTP status of a failed initial load (e.g. 403 when the user is not authorized to
  // read this thesis — the read-side IDOR guard). Drives an access-denied state instead
  // of a blank page. Null = no load error.
  const [loadErrorStatus, setLoadErrorStatus] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)
  // The validation stage being rejected. Null means the modal is closed.
  const [rejectStage, setRejectStage] = useState<null | 'ARCHIVE' | 'SERVICE'>(null)
  // The mentor decision currently being collected. Null means the modal is closed.
  const [mentorDecision, setMentorDecision] = useState<MentorDecisionMode | null>(null)
  // Archive-only inline editor for archived thesis notes.
  const [editingArchiveNotes, setEditingArchiveNotes] = useState(false)
  const [archiveNotesDraft, setArchiveNotesDraft] = useState('')

  // Load both thesis and history in parallel
  useEffect(() => {
    if (!id) return
    setLoadErrorStatus(null)
    Promise.all([thesisApi.getById(id), thesisApi.getHistory(id)])
      .then(([t, h]) => {
        setThesis(t)
        setHistory(h)
      })
      .catch((err) => {
        // A 403 here means "authenticated but not allowed to read THIS thesis". The
        // interceptor keeps the session (no logout); we render an access-denied state.
        const status =
          (err as { response?: { status?: number } })?.response?.status ?? -1
        setLoadErrorStatus(status)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <ThesisDetailSkeleton />
  if (loadErrorStatus != null) return <ThesisAccessDenied forbidden={loadErrorStatus === 403} onBack={() => navigate(-1)} />
  if (!thesis) return null

  // ----- ACTIONS -----
  // We wrap each action with shared error/loading handling.
  const runAction = async (label: string, fn: () => Promise<Thesis>) => {
    setActionLoading(true)
    try {
      const updated = await fn()
      setThesis(updated)
      const newHist = await thesisApi.getHistory(updated.id)
      setHistory(newHist)
      toast.success(label)
    } catch {
      // interceptor
    } finally {
      setActionLoading(false)
    }
  }

  // ----- ROLE & STATUS DRIVEN BUTTONS -----
  // Each action button only renders when both role and status match.
  const isStudent = user?.role === 'STUDENT' && thesis.studentId === user.id
  const isMentor  = user?.role === 'MENTOR'  && thesis.mentorId  === user.id
  const isAdmin   = user?.role === 'STUDENT_SERVICE'
  const isArchive = user?.role === 'ARCHIVE'

  // Submission deadline (1 month from creation). Null on legacy theses created
  // before the deadline feature — those are never treated as expired.
  const deadlineExpired =
    thesis.submissionDeadline != null && new Date(thesis.submissionDeadline).getTime() < Date.now()

  // Approve a validation stage — no comment needed, runs immediately.
  const approveValidation = (
    label: string,
    api: (id: string, approved: boolean, comment?: string) => Promise<Thesis>
  ) => runAction(label, () => api(thesis.id, true))

  // Reject callback invoked by RejectValidationModal once the required comment is entered.
  const confirmReject = async (comment: string) => {
    if (!rejectStage) return
    const isArchiveStage = rejectStage === 'ARCHIVE'
    const label = isArchiveStage ? 'Архивата одби' : 'Студентската служба одби'
    const api = isArchiveStage ? thesisApi.archiveValidate : thesisApi.serviceValidate
    await runAction(label, () => api(thesis.id, false, comment))
    setRejectStage(null)
  }

  // Confirm callback invoked by MentorDecisionModal once the comment is entered.
  // REQUEST_CHANGES requires a comment (enforced in the modal + backend); REJECT's is optional.
  const confirmMentorDecision = async (comment: string) => {
    if (!mentorDecision) return
    if (mentorDecision === 'REQUEST_CHANGES') {
      await runAction('Побарани се измени',
        () => thesisApi.decideMentorRequest(thesis.id, 'REQUEST_CHANGES', comment))
    } else {
      await runAction('Темата е одбиена',
        () => thesisApi.decideMentorRequest(thesis.id, 'REJECT', comment || undefined))
    }
    setMentorDecision(null)
  }

  // P2.2 — save the archive notes. Backend enforces ARCHIVE role + ARCHIVED status; this
  // never changes the thesis status. Empty draft clears the notes.
  const saveArchiveNotes = async () => {
    setActionLoading(true)
    try {
      const updated = await thesisApi.updateArchiveNotes(thesis.id, archiveNotesDraft.trim())
      setThesis(updated)
      setEditingArchiveNotes(false)
      toast.success('Забелешките на архивата се зачувани')
    } catch {
      // interceptor surfaces the error
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <button
        onClick={() => navigate('/theses')}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад кон дипломски работи
      </button>

      {/* Archive Record — only when thesis is officially archived */}
      {thesis.status === 'ARCHIVED' && thesis.archiveRegistrationNumber && (
        <div className="card mb-6 p-5 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50/60 to-transparent dark:from-emerald-950/30 dark:to-transparent">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-600 p-3 text-white shrink-0">
              <ArchiveIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Официјален архивски запис
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-mono font-bold text-gray-900 dark:text-gray-50">
                <Hash className="h-5 w-5 text-emerald-600" />
                {thesis.archiveRegistrationNumber}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Архивирано на: </span>
                  {formatDateTime(thesis.archiveDate)}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Архивирано од: </span>
                  {thesis.archivedByName ?? '—'}
                </div>
                {(thesis.archiveNotes || isArchive) && !editingArchiveNotes && (
                  <div className="sm:col-span-2 mt-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Забелешки на архивата: </span>
                    {thesis.archiveNotes ? (
                      <span className="whitespace-pre-wrap">{thesis.archiveNotes}</span>
                    ) : (
                      <span className="italic text-gray-500 dark:text-gray-400">Нема внесени забелешки.</span>
                    )}
                    {/* P2.2 — only the ARCHIVE role can add/edit these notes; backend is authoritative. */}
                    {isArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          setArchiveNotesDraft(thesis.archiveNotes ?? '')
                          setEditingArchiveNotes(true)
                        }}
                        className="ml-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400"
                      >
                        {thesis.archiveNotes ? 'Уреди забелешки' : 'Додади забелешки'}
                      </button>
                    )}
                  </div>
                )}
                {isArchive && editingArchiveNotes && (
                  <div className="sm:col-span-2 mt-1">
                    <label className="mb-1 block font-medium text-gray-900 dark:text-gray-100">
                      Забелешки на архивата
                    </label>
                    <textarea
                      value={archiveNotesDraft}
                      onChange={(e) => setArchiveNotesDraft(e.target.value)}
                      rows={3}
                      maxLength={5000}
                      placeholder="Физичка локација, состојба или друга архивска забелешка…"
                      className="input-field w-full text-sm"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={saveArchiveNotes}
                        disabled={actionLoading}
                        className="btn-primary text-xs"
                      >
                        {actionLoading ? 'Зачувување…' : 'Зачувај забелешки'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingArchiveNotes(false)}
                        disabled={actionLoading}
                        className="btn-secondary text-xs"
                      >
                        Откажи
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Defense Failed — grade 5, official faculty rule: NOT archived, student may reapply.
          Never shown together with the Archive Record card (the statuses are mutually exclusive). */}
      {thesis.status === 'DEFENSE_FAILED' && (
        <div className="card mb-6 p-5 border-l-4 border-red-500 bg-gradient-to-r from-red-50/60 to-transparent dark:from-red-950/30 dark:to-transparent">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-600 p-3 text-white shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Одбраната не е положена
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Комисијата за одбрана внесе оценка 5 — оваа дипломска работа <strong>не е</strong>{' '}
                успешно одбранета. Не е архивирана и нема официјален регистарски број.
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {isStudent
                  ? 'Можете да ја преработите темата со вашиот ментор или да поднесете сосема нова пријава за дипломска работа.'
                  : 'Студентот може да ја преработи темата со менторот или да поднесе сосема нова пријава за дипломска работа.'}
              </p>
              {isStudent && (
                <button
                  type="button"
                  onClick={() => navigate('/theses/new')}
                  className="btn-primary mt-3 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Започни нова пријава за дипломска работа
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={thesis.status} />
              {thesis.revisionCount > 0 && (
                <span
                  title={`Менторот побара измени ${thesis.revisionCount} пат(и)`}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-900"
                >
                  <RefreshCw className="h-3 w-3" />
                  {thesis.revisionCount} ревизиј{thesis.revisionCount === 1 ? 'а' : 'и'}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Креирана на {formatDate(thesis.createdAt)}
              </span>
              {deadlineExpired && (
                <span
                  title="Рокот од 1 месец за поднесување истече"
                  className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Рокот е истечен
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {thesis.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="font-medium text-gray-900 dark:text-gray-200">Студент:</span>
                {thesis.studentName}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="font-medium text-gray-900 dark:text-gray-200">Ментор:</span>
                {thesis.mentorName || <span className="italic text-gray-400">не е назначен</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Ажурирана на {formatDate(thesis.updatedAt)}
              </span>
              {thesis.submissionDeadline && (
                <span
                  className={
                    'flex items-center gap-1.5 ' +
                    (deadlineExpired ? 'text-red-600 dark:text-red-400 font-medium' : '')
                  }
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-200">Рок за поднесување:</span>
                  {formatDate(thesis.submissionDeadline)}
                  {deadlineExpired && ' (истечен)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Application PDF download — visible to all parties once generated */}
        {thesis.hasApplicationPdf && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="rounded-md bg-brand-100 p-2 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Формулар за пријава на дипломска работа (PDF)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Генериран од вашата пријава — официјален документ за валидација
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const blob = await thesisApi.downloadApplicationPdf(thesis.id)
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `application-${thesis.id}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  } catch {
                    // interceptor toast
                  }
                }}
                className="btn-secondary"
              >
                <Download className="h-3.5 w-3.5" />
                Преземи
              </button>
            </div>
          </div>
        )}

        {/* Comments */}
        {(thesis.studentComment || thesis.mentorComment || thesis.archiveComment || thesis.serviceComment) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid gap-4 sm:grid-cols-2">
            {thesis.studentComment && (
              <CommentBlock author="Студент" content={thesis.studentComment} />
            )}
            {thesis.mentorComment && (
              <CommentBlock author="Ментор" content={thesis.mentorComment} />
            )}
            {thesis.archiveComment && (
              <CommentBlock author="Архива" content={thesis.archiveComment} />
            )}
            {thesis.serviceComment && (
              <CommentBlock author="Студентска служба" content={thesis.serviceComment} />
            )}
          </div>
        )}
      </div>

      {/* Shared refresh helper for the thesis and its timeline */}
      {(() => {
        const refresh = async () => {
          const fresh = await thesisApi.getById(thesis.id)
          setThesis(fresh)
          const h = await thesisApi.getHistory(fresh.id)
          setHistory(h)
        }

        const versionsVisible =
          thesis.status === 'IN_PROGRESS' ||
          thesis.status === 'FINAL_SUBMITTED' ||
          thesis.status === 'MENTOR_APPROVED' ||
          thesis.status === 'COMMITTEE_REVIEW' ||
          thesis.status === 'COMMITTEE_ACCEPTED' ||
          thesis.status === 'PENDING_DEFENSE_CHECK' ||
          thesis.status === 'PENDING_DEFENSE_SCHEDULING' ||
          thesis.status === 'DEFENSE_SCHEDULED' ||
          thesis.status === 'DEFENSE_FAILED' ||
          thesis.status === 'ARCHIVED'

        const committeeVisible =
          thesis.status === 'MENTOR_APPROVED' ||
          thesis.status === 'COMMITTEE_REVIEW' ||
          thesis.status === 'COMMITTEE_ACCEPTED' ||
          thesis.status === 'PENDING_DEFENSE_CHECK' ||
          thesis.status === 'PENDING_DEFENSE_SCHEDULING' ||
          thesis.status === 'DEFENSE_SCHEDULED' ||
          thesis.status === 'DEFENSE_FAILED' ||
          thesis.status === 'ARCHIVED'

        const defenseVisible =
          thesis.status === 'PENDING_DEFENSE_CHECK' ||
          thesis.status === 'PENDING_DEFENSE_SCHEDULING' ||
          thesis.status === 'DEFENSE_SCHEDULED' ||
          thesis.status === 'DEFENSE_FAILED' ||
          thesis.status === 'ARCHIVED'

        return (
          <div className="space-y-6 mb-6">
            {versionsVisible && <VersionsSection thesis={thesis} onThesisChange={refresh} />}
            {committeeVisible && <CommitteeSection thesis={thesis} onThesisChange={refresh} />}
            {defenseVisible && <DefenseSection thesis={thesis} onThesisChange={refresh} />}
            {/* Self-gates on thesis.defenseDeadline — renders nothing before eligibility is verified. */}
            {defenseVisible && <DeadlineExtensionSection thesis={thesis} onThesisChange={refresh} />}
          </div>
        )
      })()}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Достапни акции
            </h2>

            {/* No actions available */}
            {!hasAnyAction(thesis, isStudent, isMentor, isAdmin, isArchive) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Нема достапни акции за вас во оваа фаза.
              </p>
            )}

            <div className="space-y-2">
              {/* Admin: decide eligibility */}
              {isAdmin && thesis.status === 'PENDING_ELIGIBILITY_CHECK' && (
                <DecisionRow
                  label="Проверка на условите"
                  onApprove={() => runAction('Условите се одобрени', () => thesisApi.decideEligibility(thesis.id, true))}
                  onReject={() => runAction('Условите се одбиени', () => thesisApi.decideEligibility(thesis.id, false))}
                  loading={actionLoading}
                />
              )}

              {/* Student: submit application */}
              {isStudent && thesis.status === 'APPLICATION_SUBMITTED' && (
                <SingleAction
                  label="Поднеси формална пријава"
                  description="Ја испраќа пријавата до администрацијата"
                  onClick={() => runAction('Пријавата е поднесена', () => thesisApi.submitApplication(thesis.id))}
                  loading={actionLoading}
                />
              )}

              {/* Student: resubmit after rejection */}
              {isStudent &&
                (thesis.status === 'APPLICATION_REJECTED_BY_ARCHIVE' ||
                 thesis.status === 'APPLICATION_REJECTED_BY_SERVICE') && (
                <SingleAction
                  label="Поднеси пријава повторно"
                  description="Ја рестартира валидацијата. Пријавата прво оди кај Архивата."
                  onClick={() => runAction('Пријавата е поднесена повторно', () => thesisApi.submitApplication(thesis.id))}
                  loading={actionLoading}
                />
              )}

              {/* Archive: approve or reject (Step 4a) */}
              {isArchive && thesis.status === 'PENDING_ARCHIVE_VALIDATION' && (
                <DecisionRow
                  label="Валидација од Архива"
                  onApprove={() => approveValidation('Архивата одобри', thesisApi.archiveValidate)}
                  onReject={() => setRejectStage('ARCHIVE')}
                  loading={actionLoading}
                />
              )}

              {/* Student Service: approve or reject (Step 4b) */}
              {isAdmin && thesis.status === 'PENDING_SERVICE_VALIDATION' && (
                <DecisionRow
                  label="Валидација од Студентска служба"
                  onApprove={() => approveValidation('Студентската служба одобри', thesisApi.serviceValidate)}
                  onReject={() => setRejectStage('SERVICE')}
                  loading={actionLoading}
                />
              )}

              {/* Mentor: approve final */}
              {isMentor && thesis.status === 'FINAL_SUBMITTED' && (
                <SingleAction
                  label="Одобри финална верзија"
                  description="Испрати до комисија за разгледување"
                  onClick={() => runAction('Финалната верзија е одобрена', () => thesisApi.approveFinal(thesis.id))}
                  loading={actionLoading}
                />
              )}

              {/* Mentor decision: ACCEPT / REQUEST_CHANGES / REJECT */}
              {isMentor && thesis.status === 'PENDING_MENTOR_APPROVAL' && (
                <MentorTriDecisionRow
                  loading={actionLoading}
                  onAccept={() =>
                    runAction('Темата е прифатена', () => thesisApi.decideMentorRequest(thesis.id, 'ACCEPT'))
                  }
                  onRequestChanges={() => setMentorDecision('REQUEST_CHANGES')}
                  onReject={() => setMentorDecision('REJECT')}
                />
              )}

              {/* Student: revise & resubmit after mentor requested changes */}
              {isStudent && thesis.status === 'MENTOR_REQUESTED_CHANGES' && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Менторот побара измени
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-200/70 px-2 py-0.5 text-[11px] font-semibold text-orange-900 dark:bg-orange-900/50 dark:text-orange-200">
                          <RefreshCw className="h-3 w-3" />
                          Ревизија {thesis.revisionCount}
                        </span>
                      </p>
                      <p className="text-xs text-orange-800 dark:text-orange-300 mt-0.5">
                        Ревидирајте го насловот или описот, потоа поднесете повторно до истиот ментор
                      </p>
                    </div>
                    <button onClick={() => setReviseOpen(true)} className="btn-primary shrink-0">
                      <RefreshCw className="h-4 w-4" />
                      Ревидирај и поднеси повторно
                    </button>
                  </div>

                  {/* Mentor's feedback surfaced inline so the student sees exactly what to change */}
                  {thesis.mentorComment && (
                    <div className="mt-3 rounded-md border border-orange-200 bg-white/70 p-3 dark:border-orange-900 dark:bg-orange-950/40">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300 flex items-center gap-1.5 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Повратна информација од менторот
                      </p>
                      <p className="text-sm text-orange-900 dark:text-orange-100 whitespace-pre-wrap">
                        {thesis.mentorComment}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Student picks a mentor and submits the topic request */}
              {isStudent && (thesis.status === 'TOPIC_SELECTION' || thesis.status === 'MENTOR_REJECTED_TOPIC') && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {thesis.status === 'MENTOR_REJECTED_TOPIC' ? 'Изберете друг ментор' : 'Изберете ментор и тема'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Изберете ментор и испратете го вашето барање за тема
                    </p>
                  </div>
                  <button onClick={() => setMentorPickerOpen(true)} className="btn-primary">
                    <UserPlus className="h-4 w-4" />
                    Избери ментор
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
              <History className="h-4 w-4" />
              Временска рамка на процесот
            </h2>
            <Timeline history={history} />
          </div>
        </div>
      </div>

      {/* Mentor picker modal */}
      <MentorPickerModal
        open={mentorPickerOpen}
        onClose={() => setMentorPickerOpen(false)}
        thesisId={thesis.id}
        onSubmitted={async (updated) => {
          setThesis(updated)
          const h = await thesisApi.getHistory(updated.id)
          setHistory(h)
        }}
      />

      {/* Rejection-comment modal for the two-stage application validation */}
      <RejectValidationModal
        open={rejectStage !== null}
        onClose={() => setRejectStage(null)}
        stageLabel={rejectStage === 'ARCHIVE' ? 'Архива' : 'Студентска служба'}
        submitting={actionLoading}
        onConfirm={confirmReject}
      />

      {/* Mentor decision modal — collects the comment for REQUEST_CHANGES / REJECT */}
      <MentorDecisionModal
        mode={mentorDecision}
        onClose={() => setMentorDecision(null)}
        submitting={actionLoading}
        onConfirm={confirmMentorDecision}
      />

      {/* Revise & resubmit modal — student-side companion to mentor's REQUEST_CHANGES */}
      <ReviseProposalModal
        open={reviseOpen}
        onClose={() => setReviseOpen(false)}
        thesis={thesis}
        mentorFeedback={thesis.mentorComment}
        onSubmitted={async (updated) => {
          setThesis(updated)
          const h = await thesisApi.getHistory(updated.id)
          setHistory(h)
        }}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function hasAnyAction(thesis: Thesis, isStudent: boolean, isMentor: boolean, isAdmin: boolean, isArchive: boolean): boolean {
  if (isAdmin && (
    thesis.status === 'PENDING_ELIGIBILITY_CHECK' ||
    thesis.status === 'PENDING_SERVICE_VALIDATION'
  )) return true
  if (isArchive && thesis.status === 'PENDING_ARCHIVE_VALIDATION') return true
  if (isStudent && (
    thesis.status === 'APPLICATION_SUBMITTED' ||
    thesis.status === 'TOPIC_SELECTION' ||
    thesis.status === 'MENTOR_REJECTED_TOPIC' ||
    thesis.status === 'MENTOR_REQUESTED_CHANGES' ||
    thesis.status === 'APPLICATION_REJECTED_BY_ARCHIVE' ||
    thesis.status === 'APPLICATION_REJECTED_BY_SERVICE'
  )) return true
  if (isMentor && (thesis.status === 'FINAL_SUBMITTED' || thesis.status === 'PENDING_MENTOR_APPROVAL')) return true
  return false
}

function CommentBlock({ author, content }: { author: string; content: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
        <MessageSquare className="h-3 w-3" />
        {author}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}

function SingleAction({
  label, description, onClick, loading,
}: { label: string; description: string; onClick: () => void; loading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button onClick={onClick} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Потврди
      </button>
    </div>
  )
}

function DecisionRow({
  label, onApprove, onReject, loading,
}: { label: string; onApprove: () => void; onReject: () => void; loading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <div className="flex gap-2">
        <button onClick={onReject} disabled={loading} className="btn-secondary">
          <XCircle className="h-4 w-4 text-red-500" />
          Одбиј
        </button>
        <button onClick={onApprove} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Одобри
        </button>
      </div>
    </div>
  )
}

/**
 * Three-option mentor decision: Accept / Request Changes / Reject.
 * Separate from DecisionRow because the orange "request changes" path is unique to mentor review.
 */
function MentorTriDecisionRow({
  loading, onAccept, onRequestChanges, onReject,
}: {
  loading: boolean
  onAccept: () => void
  onRequestChanges: () => void
  onReject: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Барање за тема</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Прифатете, побарајте измени, или одбијте</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onReject} disabled={loading} className="btn-secondary">
          <XCircle className="h-4 w-4 text-red-500" />
          Одбиј
        </button>
        <button
          onClick={onRequestChanges}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Побарај измени
        </button>
        <button onClick={onAccept} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Прифати
        </button>
      </div>
    </div>
  )
}

function Timeline({ history }: { history: ThesisStatusHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Сè уште нема историја</p>
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-gray-200 dark:border-gray-800 pl-4">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          {/* Dot */}
          <span className="absolute -left-[1.4rem] mt-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" />
          <div className="flex flex-col gap-1">
            <StatusBadge status={entry.newStatus} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDateTime(entry.changedAt)}
              {entry.changedByName && <> · од {entry.changedByName}</>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Shown when the initial thesis load fails. A 403 means the signed-in user is not
// authorized to read this thesis (read-side IDOR guard) — the session is still valid,
// so we present an access-denied panel rather than logging the user out.
function ThesisAccessDenied({ forbidden, onBack }: { forbidden: boolean; onBack: () => void }) {
  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
          {forbidden ? 'Пристапот е одбиен' : 'Не може да се вчита дипломската работа'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {forbidden
            ? 'Немате дозвола да ја прегледате оваа дипломска работа. Ако сметате дека ова е грешка, контактирајте ја Студентската служба.'
            : 'Настана грешка при вчитувањето на дипломската работа. Обидете се повторно.'}
        </p>
      </div>
    </div>
  )
}

function ThesisDetailSkeleton() {
  return (
    <div className="max-w-5xl space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="card p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="card p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
