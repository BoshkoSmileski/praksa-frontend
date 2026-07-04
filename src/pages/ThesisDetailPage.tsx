import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, User, MessageSquare, CheckCircle, XCircle, Loader2, History, UserPlus, RefreshCw, AlertCircle, Archive as ArchiveIcon, Hash, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { MentorPickerModal } from '@/features/mentor-picker/MentorPickerModal'
import { ReviseProposalModal } from '@/features/revise-proposal/ReviseProposalModal'
import { VersionsSection } from '@/features/versions/VersionsSection'
import { CommitteeSection } from '@/features/committee/CommitteeSection'
import { DefenseSection } from '@/features/defense/DefenseSection'
import { formatDate, formatDateTime } from '@/utils/date'
import type { Thesis, ThesisStatusHistory } from '@/types/api'

export function ThesisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [thesis, setThesis] = useState<Thesis | null>(null)
  const [history, setHistory] = useState<ThesisStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)

  // Load both thesis and history in parallel
  useEffect(() => {
    if (!id) return
    Promise.all([thesisApi.getById(id), thesisApi.getHistory(id)])
      .then(([t, h]) => {
        setThesis(t)
        setHistory(h)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <ThesisDetailSkeleton />
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

  // Helper: validation with optional comment. Falls back to a browser prompt for the comment.
  const runValidation = (
    label: string,
    approved: boolean,
    api: (id: string, approved: boolean, comment?: string) => Promise<typeof thesis>
  ) => {
    let comment: string | undefined
    if (!approved) {
      // A rejection comment is required by the backend
      const entered = window.prompt('Reason for rejection (required):')
      if (!entered || !entered.trim()) {
        toast.error('A rejection comment is required')
        return
      }
      comment = entered.trim()
    }
    return runAction(label, () => api(thesis.id, approved, comment))
  }

  return (
    <div className="max-w-5xl">
      <button
        onClick={() => navigate('/theses')}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to theses
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
                Official Archive Record
              </p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-mono font-bold text-gray-900 dark:text-gray-50">
                <Hash className="h-5 w-5 text-emerald-600" />
                {thesis.archiveRegistrationNumber}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Archived on: </span>
                  {formatDateTime(thesis.archiveDate)}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Archived by: </span>
                  {thesis.archivedByName ?? '—'}
                </div>
                {thesis.archiveNotes && (
                  <div className="sm:col-span-2 mt-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Archive notes: </span>
                    <span className="whitespace-pre-wrap">{thesis.archiveNotes}</span>
                  </div>
                )}
              </div>
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
                  title={`Mentor has requested changes ${thesis.revisionCount} time${thesis.revisionCount === 1 ? '' : 's'}`}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-900"
                >
                  <RefreshCw className="h-3 w-3" />
                  {thesis.revisionCount} revision{thesis.revisionCount === 1 ? '' : 's'}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created {formatDate(thesis.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {thesis.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="font-medium text-gray-900 dark:text-gray-200">Student:</span>
                {thesis.studentName}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="font-medium text-gray-900 dark:text-gray-200">Mentor:</span>
                {thesis.mentorName || <span className="italic text-gray-400">not assigned</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Updated {formatDate(thesis.updatedAt)}
              </span>
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
                    Thesis Application Form (PDF)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Generated from your submission — official document for validation
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
                Download
              </button>
            </div>
          </div>
        )}

        {/* Comments */}
        {(thesis.studentComment || thesis.mentorComment || thesis.archiveComment || thesis.serviceComment) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid gap-4 sm:grid-cols-2">
            {thesis.studentComment && (
              <CommentBlock author="Student" content={thesis.studentComment} />
            )}
            {thesis.mentorComment && (
              <CommentBlock author="Mentor" content={thesis.mentorComment} />
            )}
            {thesis.archiveComment && (
              <CommentBlock author="Archive" content={thesis.archiveComment} />
            )}
            {thesis.serviceComment && (
              <CommentBlock author="Student Service" content={thesis.serviceComment} />
            )}
          </div>
        )}
      </div>

      {/* Helper closures so we don't repeat the refresh logic */}
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
          thesis.status === 'DEFENSE_SCHEDULED' ||
          thesis.status === 'ARCHIVED'

        const committeeVisible =
          thesis.status === 'MENTOR_APPROVED' ||
          thesis.status === 'COMMITTEE_REVIEW' ||
          thesis.status === 'COMMITTEE_ACCEPTED' ||
          thesis.status === 'PENDING_DEFENSE_CHECK' ||
          thesis.status === 'DEFENSE_SCHEDULED' ||
          thesis.status === 'ARCHIVED'

        const defenseVisible =
          thesis.status === 'PENDING_DEFENSE_CHECK' ||
          thesis.status === 'DEFENSE_SCHEDULED' ||
          thesis.status === 'ARCHIVED'

        return (
          <div className="space-y-6 mb-6">
            {versionsVisible && <VersionsSection thesis={thesis} onThesisChange={refresh} />}
            {committeeVisible && <CommitteeSection thesis={thesis} onThesisChange={refresh} />}
            {defenseVisible && <DefenseSection thesis={thesis} onThesisChange={refresh} />}
          </div>
        )
      })()}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Available Actions
            </h2>

            {/* No actions available */}
            {!hasAnyAction(thesis, isStudent, isMentor, isAdmin, isArchive) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No actions available for you at this stage.
              </p>
            )}

            <div className="space-y-2">
              {/* Admin: decide eligibility */}
              {isAdmin && thesis.status === 'PENDING_ELIGIBILITY_CHECK' && (
                <DecisionRow
                  label="Eligibility Check"
                  onApprove={() => runAction('Eligibility approved', () => thesisApi.decideEligibility(thesis.id, true))}
                  onReject={() => runAction('Eligibility rejected', () => thesisApi.decideEligibility(thesis.id, false))}
                  loading={actionLoading}
                />
              )}

              {/* Student: submit application */}
              {isStudent && thesis.status === 'APPLICATION_SUBMITTED' && (
                <SingleAction
                  label="Submit Formal Application"
                  description="Sends the application to the administrative office"
                  onClick={() => runAction('Application submitted', () => thesisApi.submitApplication(thesis.id))}
                  loading={actionLoading}
                />
              )}

              {/* Student: resubmit after rejection */}
              {isStudent &&
                (thesis.status === 'APPLICATION_REJECTED_BY_ARCHIVE' ||
                 thesis.status === 'APPLICATION_REJECTED_BY_SERVICE') && (
                <SingleAction
                  label="Resubmit Application"
                  description="Restart validation. Application will go to Archive first."
                  onClick={() => runAction('Application resubmitted', () => thesisApi.submitApplication(thesis.id))}
                  loading={actionLoading}
                />
              )}

              {/* Archive: approve or reject (Step 4a) */}
              {isArchive && thesis.status === 'PENDING_ARCHIVE_VALIDATION' && (
                <DecisionRow
                  label="Archive Validation"
                  onApprove={() => runValidation('Archive approved', true, thesisApi.archiveValidate)}
                  onReject={() => runValidation('Archive rejected', false, thesisApi.archiveValidate)}
                  loading={actionLoading}
                />
              )}

              {/* Student Service: approve or reject (Step 4b) */}
              {isAdmin && thesis.status === 'PENDING_SERVICE_VALIDATION' && (
                <DecisionRow
                  label="Student Service Validation"
                  onApprove={() => runValidation('Service approved', true, thesisApi.serviceValidate)}
                  onReject={() => runValidation('Service rejected', false, thesisApi.serviceValidate)}
                  loading={actionLoading}
                />
              )}

              {/* Mentor: approve final */}
              {isMentor && thesis.status === 'FINAL_SUBMITTED' && (
                <SingleAction
                  label="Approve Final Thesis"
                  description="Send to committee for review"
                  onClick={() => runAction('Final approved', () => thesisApi.approveFinal(thesis.id))}
                  loading={actionLoading}
                />
              )}

              {/* Mentor decision: ACCEPT / REQUEST_CHANGES / REJECT */}
              {isMentor && thesis.status === 'PENDING_MENTOR_APPROVAL' && (
                <MentorTriDecisionRow
                  loading={actionLoading}
                  onAccept={() =>
                    runAction('Topic accepted', () => thesisApi.decideMentorRequest(thesis.id, 'ACCEPT'))
                  }
                  onRequestChanges={() => {
                    const comment = window.prompt('What needs to change? (required)')
                    if (!comment || !comment.trim()) {
                      toast.error('A comment is required when requesting changes')
                      return
                    }
                    runAction('Changes requested',
                      () => thesisApi.decideMentorRequest(thesis.id, 'REQUEST_CHANGES', comment.trim()))
                  }}
                  onReject={() => {
                    const comment = window.prompt('Optional comment (leave blank to skip):') ?? undefined
                    runAction('Topic rejected',
                      () => thesisApi.decideMentorRequest(thesis.id, 'REJECT', comment?.trim() || undefined))
                  }}
                />
              )}

              {/* Student: revise & resubmit after mentor requested changes */}
              {isStudent && thesis.status === 'MENTOR_REQUESTED_CHANGES' && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
                  <div>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Mentor requested changes
                    </p>
                    <p className="text-xs text-orange-800 dark:text-orange-300">
                      Revise your title or description, then resubmit to the same mentor
                    </p>
                  </div>
                  <button onClick={() => setReviseOpen(true)} className="btn-primary">
                    <RefreshCw className="h-4 w-4" />
                    Revise & Resubmit
                  </button>
                </div>
              )}

              {/* Student picks a mentor and submits the topic request */}
              {isStudent && (thesis.status === 'TOPIC_SELECTION' || thesis.status === 'MENTOR_REJECTED_TOPIC') && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {thesis.status === 'MENTOR_REJECTED_TOPIC' ? 'Choose Another Mentor' : 'Select Mentor & Topic'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pick a mentor and send your topic request
                    </p>
                  </div>
                  <button onClick={() => setMentorPickerOpen(true)} className="btn-primary">
                    <UserPlus className="h-4 w-4" />
                    Pick Mentor
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
              Workflow Timeline
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
        Confirm
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
          Reject
        </button>
        <button onClick={onApprove} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Approve
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
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Topic Request</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Accept, request changes, or reject</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onReject} disabled={loading} className="btn-secondary">
          <XCircle className="h-4 w-4 text-red-500" />
          Reject
        </button>
        <button
          onClick={onRequestChanges}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Request Changes
        </button>
        <button onClick={onAccept} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Accept
        </button>
      </div>
    </div>
  )
}

function Timeline({ history }: { history: ThesisStatusHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No history yet</p>
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
              {entry.changedByName && <> · by {entry.changedByName}</>}
            </p>
          </div>
        </li>
      ))}
    </ol>
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
