import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { thesisApi } from '@/api/thesisApi'

interface DeadlineExtensionModalProps {
  open: boolean
  onClose: () => void
  thesisId: string
  onRequested: () => void
}

/**
 * Official faculty procedure: STUDENT requests an extension of the defense deadline, for a
 * maximum of 15 additional days, with a written explanation. Submitting creates a PENDING
 * request awaiting a Student Service decision — it never changes the deadline directly. The
 * backend is the authoritative validator (1-15 day range, one-pending-at-a-time, at most one
 * approved extension per thesis); this form only blocks obviously-invalid input.
 */
export function DeadlineExtensionModal({ open, onClose, thesisId, onRequested }: DeadlineExtensionModalProps) {
  const [reason, setReason] = useState('')
  const [requestedDays, setRequestedDays] = useState(15)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setRequestedDays(15)
    }
  }, [open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Причината е задолжителна')
      return
    }
    if (requestedDays < 1 || requestedDays > 15) {
      toast.error('Бројот на побарани денови мора да биде помеѓу 1 и 15')
      return
    }
    setSubmitting(true)
    try {
      await thesisApi.requestDeadlineExtension(thesisId, reason.trim(), requestedDays)
      toast.success('Побарано е продолжување на рокот — чека одобрување од Студентската служба')
      onRequested()
      onClose()
    } catch {
      // interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Побарај продолжување на рокот"
      description="Побарајте продолжување на рокот за одбрана (максимум 15 дополнителни дена). Студентската служба мора да го одобри барањето."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={submitting}>
            Откажи
          </button>
          <button
            type="submit"
            form="deadline-extension-form"
            disabled={submitting || !reason.trim() || requestedDays < 1 || requestedDays > 15}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Поднеси барање
          </button>
        </>
      }
    >
      <form id="deadline-extension-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Причина <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={2000}
            className="input-field resize-none"
            placeholder="Образложение за продолжување на рокот..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Број на побарани дополнителни денови <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min={1}
            max={15}
            value={requestedDays}
            onChange={(e) => setRequestedDays(Number(e.target.value))}
            className="input-field w-32"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Максимум 15 дена по барање (согласно факултетската процедура).
          </p>
        </div>
      </form>
    </Modal>
  )
}
