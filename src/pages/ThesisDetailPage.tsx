import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, User, MessageSquare, CheckCircle, XCircle, Loader2, History, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { MentorPickerModal } from '@/features/mentor-picker/MentorPickerModal'
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
  const isAdmin   = user?.role === 'ADMIN'

  return (
    <div className="max-w-5xl">
      <button
        onClick={() => navigate('/theses')}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to theses
      </button>

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={thesis.status} />
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

        {/* Comments */}
        {(thesis.studentComment || thesis.mentorComment) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid gap-4 sm:grid-cols-2">
            {thesis.studentComment && (
              <CommentBlock author="Student" content={thesis.studentComment} />
            )}
            {thesis.mentorComment && (
              <CommentBlock author="Mentor" content={thesis.mentorComment} />
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
            {!hasAnyAction(thesis, isStudent, isMentor, isAdmin) && (
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

              {/* Admin: validate application */}
              {isAdmin && thesis.status === 'ADMINISTRATIVE_VALIDATION' && (
                <SingleAction
                  label="Validate Application"
                  description="Move thesis to IN_PROGRESS"
                  onClick={() => runAction('Application validated', () => thesisApi.validateApplication(thesis.id))}
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

              {/* Mentor decision when topic is pending */}
              {isMentor && thesis.status === 'PENDING_MENTOR_APPROVAL' && (
                <DecisionRow
                  label="Topic Request"
                  onApprove={() => runAction('Topic accepted', () => thesisApi.decideMentorRequest(thesis.id, true))}
                  onReject={() => runAction('Topic rejected', () => thesisApi.decideMentorRequest(thesis.id, false))}
                  loading={actionLoading}
                />
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
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function hasAnyAction(thesis: Thesis, isStudent: boolean, isMentor: boolean, isAdmin: boolean): boolean {
  if (isAdmin && (thesis.status === 'PENDING_ELIGIBILITY_CHECK' || thesis.status === 'ADMINISTRATIVE_VALIDATION')) return true
  if (isStudent && (thesis.status === 'APPLICATION_SUBMITTED' || thesis.status === 'TOPIC_SELECTION' || thesis.status === 'MENTOR_REJECTED_TOPIC')) return true
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
