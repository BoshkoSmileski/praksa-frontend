import { useEffect, useState } from 'react'
import { Loader2, User, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { userApi } from '@/api/userApi'
import { committeeApi } from '@/api/committeeApi'
import { cn } from '@/utils/cn'
import type { UserSummary } from '@/types/api'

interface ProposeCommitteeModalProps {
  open: boolean
  onClose: () => void
  thesisId: string
  // The current mentor — we exclude them from the picker (auto-added by backend)
  mentorId: string | null
  onProposed: () => void
}

export function ProposeCommitteeModal({
  open, onClose, thesisId, mentorId, onProposed,
}: ProposeCommitteeModalProps) {
  const [mentors, setMentors] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedIds([])
    setLoading(true)
    userApi
      .getByRole('MENTOR')
      // The mentor of this thesis is auto-added as MENTOR_MEMBER by the backend;
      // they cannot also be a formal member, so we filter them out of the picker.
      .then((all) => setMentors(all.filter((m) => m.id !== mentorId)))
      .finally(() => setLoading(false))
  }, [open, mentorId])

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 2
        ? prev  // hard cap at 2 — backend also enforces this
        : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedIds.length !== 2) return
    setSubmitting(true)
    try {
      await committeeApi.propose(thesisId, selectedIds)
      toast.success('Committee proposed')
      onProposed()
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
      title="Propose Committee"
      description="Select exactly 2 additional professors. You are automatically the third member."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length !== 2 || submitting}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Propose Committee
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
          Selected: <strong>{selectedIds.length} / 2</strong>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : mentors.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No other professors available.</p>
          ) : (
            mentors.map((m) => {
              const isSelected = selectedIds.includes(m.id)
              const isDisabled = !isSelected && selectedIds.length >= 2
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  disabled={isDisabled}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-950'
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-800 dark:bg-gray-800/30'
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
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{m.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                  </div>
                  {isSelected && <CheckCircle className="h-5 w-5 text-brand-600 shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
