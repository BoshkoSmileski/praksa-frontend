import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

interface RejectValidationModalProps {
  open: boolean
  onClose: () => void
  /** Human-readable stage name, e.g. "Archive" or "Student Service". */
  stageLabel: string
  submitting: boolean
  /** Called with the trimmed, non-empty rejection comment. */
  onConfirm: (comment: string) => void
}

/**
 * Collects the mandatory rejection reason for the two-stage application validation
 * (Archive / Student Service). Replaces the old browser prompt() so the flow uses
 * the project's standard Modal component.
 *
 * The comment is required — the backend rejects a blank comment with a 400, and we
 * mirror that rule here so the user gets immediate feedback.
 */
export function RejectValidationModal({
  open, onClose, stageLabel, submitting, onConfirm,
}: RejectValidationModalProps) {
  const [comment, setComment] = useState('')

  // Reset the field each time the modal opens
  useEffect(() => {
    if (open) setComment('')
  }, [open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('A rejection comment is required')
      return
    }
    onConfirm(comment.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reject Application — ${stageLabel}`}
      description="The student will see this reason and must resubmit, restarting from Archive validation."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="reject-validation-form"
            disabled={submitting || !comment.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject Application
          </button>
        </>
      }
    >
      <form id="reject-validation-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            className="input-field resize-none"
            placeholder="Explain what the student needs to correct before resubmitting..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This note is required and will be shown to the student.
          </p>
        </div>
      </form>
    </Modal>
  )
}
