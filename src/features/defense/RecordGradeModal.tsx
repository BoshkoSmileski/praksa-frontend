import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { defenseApi } from '@/api/defenseApi'

interface RecordGradeModalProps {
  open: boolean
  onClose: () => void
  thesisId: string
  defenseId: string
  onRecorded: () => void
}

export function RecordGradeModal({ open, onClose, thesisId, defenseId, onRecorded }: RecordGradeModalProps) {
  const [grade, setGrade] = useState<number>(8)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await defenseApi.recordResult(thesisId, defenseId, grade, notes.trim() || undefined)
      toast.success(`Grade ${grade} recorded — thesis archived`)
      onRecorded()
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
      title="Record Defense Grade"
      description="Recording a grade will archive the thesis."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="submit"
            form="grade-form"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Record Grade
          </button>
        </>
      }
    >
      <form id="grade-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grade: <span className="text-2xl font-bold text-brand-600">{grade}</span>
          </label>
          <input
            type="range"
            min={5}
            max={10}
            step={1}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {[5, 6, 7, 8, 9, 10].map((n) => <span key={n}>{n}</span>)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Defense feedback, strengths, etc..."
            className="input-field resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
