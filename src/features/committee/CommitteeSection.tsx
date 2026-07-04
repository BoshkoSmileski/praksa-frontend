import { useEffect, useState } from 'react'
import { Users, Star, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { committeeApi } from '@/api/committeeApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/date'
import { ProposeCommitteeModal } from './ProposeCommitteeModal'
import type { Thesis, CommitteeMember } from '@/types/api'

interface CommitteeSectionProps {
  thesis: Thesis
  onThesisChange: () => void
}

export function CommitteeSection({ thesis, onThesisChange }: CommitteeSectionProps) {
  const [members, setMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [proposeOpen, setProposeOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const user = useAuthStore((s) => s.user)

  const reload = () => committeeApi.list(thesis.id).then(setMembers)

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [thesis.id])

  // ---- Role checks for what this user is allowed to do ----
  const isMentorOwner = user?.role === 'MENTOR' && thesis.mentorId === user.id
  const isAdmin       = user?.role === 'STUDENT_SERVICE'
  // Is this user one of the committee members for this thesis?
  const myMembership  = members.find((m) => m.professorId === user?.id)

  const canPropose       = isMentorOwner && thesis.status === 'MENTOR_APPROVED' && members.length === 0
  const canApprove       = isAdmin && thesis.status === 'MENTOR_APPROVED' && members.length === 3
  const canSubmitReview  = !!myMembership && thesis.status === 'COMMITTEE_REVIEW'
  const canAcceptReview  = isAdmin && thesis.status === 'COMMITTEE_REVIEW'

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await committeeApi.approve(thesis.id)
      toast.success('Committee approved')
      await reload()
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitNote = async (memberId: string) => {
    setActionLoading(true)
    try {
      const updated = await committeeApi.submitReview(thesis.id, memberId, noteDraft)
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      setEditingMemberId(null)
      setNoteDraft('')
      toast.success('Review submitted')
    } catch {
      // interceptor
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptReview = async () => {
    setActionLoading(true)
    try {
      await committeeApi.acceptReview(thesis.id)
      toast.success('Committee review accepted')
      onThesisChange()
    } catch {
      // interceptor
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-50">
          <Users className="h-5 w-5" />
          Committee
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {members.length} / 3 members
        </span>
      </div>

      {/* Top-level actions */}
      <div className="space-y-2 mb-4">
        {canPropose && (
          <button onClick={() => setProposeOpen(true)} className="btn-primary">
            <Users className="h-4 w-4" />
            Propose Committee
          </button>
        )}
        {canApprove && (
          <button onClick={handleApprove} disabled={actionLoading} className="btn-primary">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve Committee
          </button>
        )}
        {canAcceptReview && (
          <button onClick={handleAcceptReview} disabled={actionLoading} className="btn-primary">
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Accept Committee Review
          </button>
        )}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500 italic dark:text-gray-400">
          No committee proposed yet
        </p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const isMe = m.professorId === user?.id
            const isEditing = editingMemberId === m.id
            return (
              <div key={m.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-100 p-2 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {m.memberRole === 'MENTOR_MEMBER' ? <Star className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.professorName}</p>
                      {isMe && (
                        <span className="text-xs text-brand-600 dark:text-brand-400">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {m.memberRole === 'MENTOR_MEMBER' ? 'Mentor Member' : 'Formal Member'}
                      {m.approvedAt && <> · approved {formatDateTime(m.approvedAt)}</>}
                    </p>
                  </div>
                </div>

                {/* Existing notes */}
                {m.notes && !isEditing && (
                  <div className="mt-2 ml-11 rounded bg-gray-50 p-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {m.notes}
                  </div>
                )}

                {/* Editing UI */}
                {isEditing && (
                  <div className="mt-2 ml-11 space-y-2">
                    <textarea
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Your review notes (optional)..."
                      maxLength={3000}
                      className="input-field resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingMemberId(null); setNoteDraft('') }} className="btn-secondary">Cancel</button>
                      <button onClick={() => handleSubmitNote(m.id)} disabled={actionLoading} className="btn-primary">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Submit Review
                      </button>
                    </div>
                  </div>
                )}

                {/* Show "Submit your review" button when applicable */}
                {canSubmitReview && isMe && !isEditing && (
                  <button
                    onClick={() => { setEditingMemberId(m.id); setNoteDraft(m.notes || '') }}
                    className="mt-2 ml-11 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    {m.notes ? 'Edit your review' : 'Submit your review →'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ProposeCommitteeModal
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        thesisId={thesis.id}
        mentorId={thesis.mentorId}
        onProposed={() => reload()}
      />
    </div>
  )
}
