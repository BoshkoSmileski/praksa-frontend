import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Hash, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { userApi } from '@/api/userApi'
import type { StudentSummary, UserDetail } from '@/types/api'

interface EditCreditsModalProps {
  open: boolean
  onClose: () => void
  student: StudentSummary | null
  // Called with the fresh detail returned by the backend after a successful update
  onUpdated: (updated: UserDetail) => void
}

/**
 * STUDENT_SERVICE dialog to SET a student's credit balance.
 *
 * Semantics match the backend (UserServiceImpl.updateCredits): this SETS the
 * absolute credit total, it does not add to the existing balance. The input is
 * an integer >= 0; the backend re-validates (@Min(0)) and enforces that only
 * STUDENT_SERVICE may call it and only for a STUDENT target. This UI is a
 * usability layer only — hiding it is never the security mechanism.
 */
export function EditCreditsModal({ open, onClose, student, onUpdated }: EditCreditsModalProps) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Prefill with the current balance each time the modal opens for a student.
  useEffect(() => {
    if (open && student) {
      setValue(student.credits != null ? String(student.credits) : '')
    }
  }, [open, student])

  if (!student) return null

  // Integer, non-negative. Reject empty, decimals, and negatives in the UI.
  const parsed = value.trim() === '' ? NaN : Number(value)
  const valid = Number.isInteger(parsed) && parsed >= 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSubmitting(true)
    try {
      const updated = await userApi.updateCredits(student.id, parsed)
      toast.success(`Credits for ${updated.fullName} set to ${updated.credits}`)
      onUpdated(updated)
      onClose()
    } catch {
      // Error toast handled by the axios response interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set Student Credits"
      description="This sets the student's total credit balance (it does not add to it)."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="submit"
            form="edit-credits-form"
            disabled={submitting || !valid}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Credits
          </button>
        </>
      }
    >
      <form id="edit-credits-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Who we're editing */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {student.fullName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {student.email}
            </span>
            {student.indexNumber && (
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {student.indexNumber}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Current balance:{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {student.credits != null ? student.credits : 'not recorded'}
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="credits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New credit balance <span className="text-red-500">*</span>
          </label>
          <input
            id="credits"
            type="number"
            required
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input-field"
            placeholder="e.g. 200"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Whole number, 0 or greater. At least 200 credits are required for a student
            to submit a thesis application.
          </p>
        </div>
      </form>
    </Modal>
  )
}
