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

  const isFailing = grade === 5

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await defenseApi.recordResult(thesisId, defenseId, grade, notes.trim() || undefined)
      toast.success(
        isFailing
          ? 'Внесена е оценка 5 — одбраната не е положена; студентот може повторно да аплицира'
          : `Внесена е оценка ${grade} — дипломската работа е архивирана`
      )
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
      title="Внеси оценка од одбраната"
      description={
        isFailing
          ? 'Оценка 5 значи дека одбраната НЕ е положена — дипломската работа НЕМА да биде архивирана.'
          : 'Внесувањето оценка од 6-10 ќе ја архивира дипломската работа.'
      }
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Откажи</button>
          <button
            type="submit"
            form="grade-form"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Внеси оценка
          </button>
        </>
      }
    >
      <form id="grade-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Оценка:{' '}
            <span className={`text-2xl font-bold ${isFailing ? 'text-red-600' : 'text-brand-600'}`}>
              {grade}
            </span>
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
          {isFailing ? (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
              5 = Одбраната не е положена (не е положена — дипломската работа нема да биде архивирана)
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              6–10 = успешно одбранета (ја архивира дипломската работа)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Забелешки <span className="text-gray-400 font-normal">(опционално)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Повратна информација од одбраната, силни страни, итн..."
            className="input-field resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
