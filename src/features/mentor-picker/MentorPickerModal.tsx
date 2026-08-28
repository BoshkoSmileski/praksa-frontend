import { useEffect, useState } from 'react'
import { Loader2, User, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { userApi } from '@/api/userApi'
import { thesisApi } from '@/api/thesisApi'
import { cn } from '@/utils/cn'
import type { Thesis, MentorSummary } from '@/types/api'

interface MentorPickerModalProps {
  open: boolean
  onClose: () => void
  thesisId: string
  // Called when the request is sent — parent can refresh the thesis
  onSubmitted: (updated: Thesis) => void
}

export function MentorPickerModal({ open, onClose, thesisId, onSubmitted }: MentorPickerModalProps) {
  const [mentors, setMentors] = useState<MentorSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch mentors when modal opens. Re-fetches every open in case list changes.
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedId(null)
    setComment('')
    userApi
      .getMentors()
      .then(setMentors)
      .finally(() => setLoading(false))
  }, [open])

  const handleSubmit = async () => {
    if (!selectedId) return
    setSubmitting(true)
    try {
      const updated = await thesisApi.submitMentorRequest(thesisId, selectedId, comment.trim() || undefined)
      toast.success('Барањето до менторот е испратено')
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
      title="Изберете ментор"
      description="Изберете ментор и по желба додадете забелешка за вашата идеја за тема."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Откажи</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || submitting}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Испрати барање
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Mentor list */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : mentors.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Нема достапни ментори.</p>
          ) : (
            mentors.map((m) => {
              const isSelected = selectedId === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-950'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  )}
                >
                  <div className={cn(
                    'rounded-full p-2',
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                  )}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                      {m.fullName}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-brand-600 shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Optional comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Забелешки за менторот <span className="text-gray-400 font-normal">(опционално)</span>
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field resize-none"
            placeholder="Опишете ја накратко вашата идеја за тема..."
          />
        </div>
      </div>
    </Modal>
  )
}
