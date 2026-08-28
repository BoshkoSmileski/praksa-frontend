import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

interface RejectDeadlineExtensionModalProps {
  open: boolean
  onClose: () => void
  submitting: boolean
  /** Called with the trimmed, non-empty rejection reason. */
  onConfirm: (reason: string) => void
}

/**
 * Collects the mandatory rejection reason for a deadline extension request. Same pattern as
 * RejectDefenseRequestModal / RejectValidationModal — the backend rejects a blank reason with
 * a 400, mirrored here for immediate feedback.
 */
export function RejectDeadlineExtensionModal({
  open, onClose, submitting, onConfirm,
}: RejectDeadlineExtensionModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Причината за одбивање е задолжителна')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Одбиј продолжување на рокот"
      description="Студентот ќе ја види оваа причина. Рокот за одбрана ќе остане непроменет."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>
            Откажи
          </button>
          <button
            type="submit"
            form="reject-deadline-extension-form"
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Одбиј барање
          </button>
        </>
      }
    >
      <form id="reject-deadline-extension-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Причина за одбивање <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={2000}
            className="input-field resize-none"
            placeholder="Недоволно образложение..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Оваа причина е задолжителна и ќе биде прикажана на студентот.
          </p>
        </div>
      </form>
    </Modal>
  )
}
