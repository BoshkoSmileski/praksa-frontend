import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

interface RejectDefenseRequestModalProps {
  open: boolean
  onClose: () => void
  submitting: boolean
  /** Called with the trimmed, non-empty rejection reason. */
  onConfirm: (reason: string) => void
}

/**
 * Collects the mandatory rejection reason for a defense-term proposal. Same pattern as
 * RejectValidationModal (the archive/service application rejection modal) — the backend
 * rejects a blank reason with a 400, mirrored here for immediate feedback.
 */
export function RejectDefenseRequestModal({
  open, onClose, submitting, onConfirm,
}: RejectDefenseRequestModalProps) {
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
      title="Одбиј предлог за одбрана"
      description="Студентот ќе ја види оваа причина и мора да поднесе нов предлог."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>
            Откажи
          </button>
          <button
            type="submit"
            form="reject-defense-request-form"
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Одбиј предлог
          </button>
        </>
      }
    >
      <form id="reject-defense-request-form" onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Просторијата е зафатена во избраниот термин..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Оваа причина е задолжителна и ќе биде прикажана на студентот.
          </p>
        </div>
      </form>
    </Modal>
  )
}
