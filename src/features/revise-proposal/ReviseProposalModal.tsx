import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { thesisApi } from '@/api/thesisApi'
import type { Thesis } from '@/types/api'

interface ReviseProposalModalProps {
  open: boolean
  onClose: () => void
  thesis: Thesis
  mentorFeedback: string | null
  onSubmitted: (updated: Thesis) => void
}

/**
 * Student edits title (and optionally idea description) after mentor requested changes.
 * The same thesis row is reused — mentor stays assigned, status returns to PENDING_MENTOR_APPROVAL.
 */
export function ReviseProposalModal({
  open, onClose, thesis, mentorFeedback, onSubmitted,
}: ReviseProposalModalProps) {
  const [title, setTitle] = useState(thesis.title)
  const [comment, setComment] = useState(thesis.studentComment ?? '')
  const [submitting, setSubmitting] = useState(false)

  // Reset fields when modal opens (in case user reopens after closing)
  useEffect(() => {
    if (open) {
      setTitle(thesis.title)
      setComment(thesis.studentComment ?? '')
    }
  }, [open, thesis])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const updated = await thesisApi.reviseProposal(
        thesis.id,
        title.trim(),
        comment.trim() || undefined,
      )
      toast.success('Proposal resubmitted to mentor')
      onSubmitted(updated)
      onClose()
    } catch {
      // interceptor toast
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Revise & Resubmit Proposal"
      description="Edit your title or description, then send to the same mentor."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="submit"
            form="revise-form"
            disabled={submitting || title.trim().length < 5}
            className="btn-primary"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Resubmit
          </button>
        </>
      }
    >
      <form id="revise-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Mentor feedback (read-only) */}
        {mentorFeedback && (
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm dark:bg-orange-950/30 dark:border-orange-900">
            <p className="font-medium text-orange-900 dark:text-orange-200 mb-1">
              Mentor feedback
            </p>
            <p className="text-orange-800 dark:text-orange-300 whitespace-pre-wrap">
              {mentorFeedback}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Thesis title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            minLength={5}
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Idea description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            className="input-field resize-none"
            placeholder="Address the mentor's feedback..."
          />
        </div>
      </form>
    </Modal>
  )
}
