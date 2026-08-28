import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, RefreshCw, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

/** Which mentor decision this modal is collecting a comment for. */
export type MentorDecisionMode = 'REQUEST_CHANGES' | 'REJECT'

interface MentorDecisionModalProps {
  /** Non-null opens the modal in the given mode; null keeps it closed. */
  mode: MentorDecisionMode | null
  onClose: () => void
  submitting: boolean
  /** Called with the trimmed comment (empty string allowed only for REJECT). */
  onConfirm: (comment: string) => void
}

/**
 * Collects the mentor's comment for a REQUEST_CHANGES or REJECT decision.
 * Replaces the old window.prompt() flow with the project's standard Modal.
 *
 *   REQUEST_CHANGES → comment is REQUIRED (mirrors the backend 400 on a blank comment)
 *   REJECT          → comment is optional but encouraged
 */
export function MentorDecisionModal({
  mode, onClose, submitting, onConfirm,
}: MentorDecisionModalProps) {
  const [comment, setComment] = useState('')

  // Reset the field each time the modal (re)opens
  useEffect(() => {
    if (mode) setComment('')
  }, [mode])

  const isRequestChanges = mode === 'REQUEST_CHANGES'
  const commentMissing = isRequestChanges && !comment.trim()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (commentMissing) {
      toast.error('Потребен е коментар кога се бараат измени')
      return
    }
    onConfirm(comment.trim())
  }

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={isRequestChanges ? 'Побарај измени' : 'Одбиј тема'}
      description={
        isRequestChanges
          ? 'Кажете му на студентот што треба да смени. Тој ќе ја ревидира и повторно ќе ја поднесе до вас.'
          : 'По желба објаснете зошто темата се одбива. Студентот ќе избере друга тема или ментор.'
      }
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>
            Откажи
          </button>
          {isRequestChanges ? (
            <button
              type="submit"
              form="mentor-decision-form"
              disabled={submitting || commentMissing}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Побарај измени
            </button>
          ) : (
            <button
              type="submit"
              form="mentor-decision-form"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Одбиј тема
            </button>
          )}
        </>
      }
    >
      <form id="mentor-decision-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isRequestChanges ? 'Што треба да се промени' : 'Причина за одбивање'}
            {isRequestChanges
              ? <span className="text-red-500"> *</span>
              : <span className="text-gray-400 font-normal"> (опционално)</span>}
          </label>
          <textarea
            rows={4}
            required={isRequestChanges}
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            className="input-field resize-none"
            placeholder={
              isRequestChanges
                ? 'Објаснете што треба да прецизира студентот во предложената тема...'
                : 'По желба објаснете зошто оваа тема не може да се менторира...'
            }
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isRequestChanges
              ? 'Оваа забелешка е задолжителна и ќе биде прикажана на студентот.'
              : 'Оваа забелешка ќе биде прикажана на студентот.'}
          </p>
        </div>
      </form>
    </Modal>
  )
}
