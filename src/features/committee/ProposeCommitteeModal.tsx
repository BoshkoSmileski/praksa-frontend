import { useEffect, useState } from 'react'
import { Loader2, User, CheckCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { userApi } from '@/api/userApi'
import { committeeApi } from '@/api/committeeApi'
import { cn } from '@/utils/cn'
import type { MentorSummary } from '@/types/api'

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
  const [mentors, setMentors] = useState<MentorSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // Official faculty procedure: a 4-member committee (3 voting + 1 external non-voting
  // professional from practice) is optional — default is the existing 3-member committee.
  const [includeExternal, setIncludeExternal] = useState(false)
  const [externalId, setExternalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedIds([])
    setIncludeExternal(false)
    setExternalId(null)
    setLoading(true)
    userApi
      .getMentors()
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
        ? prev  // hard cap at 2 voting members — backend also enforces this
        : [...prev, id]
    )
    // A professor cannot be both a voting member and the external member.
    if (externalId === id) setExternalId(null)
  }

  const toggleIncludeExternal = () => {
    setIncludeExternal((prev) => {
      if (prev) setExternalId(null) // turning the option off clears any selection
      return !prev
    })
  }

  const externalCandidates = mentors.filter((m) => !selectedIds.includes(m.id))
  const canSubmit =
    selectedIds.length === 2 && (!includeExternal || externalId !== null)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const professorIds = includeExternal && externalId ? [...selectedIds, externalId] : selectedIds
      await committeeApi.propose(thesisId, professorIds, includeExternal ? externalId ?? undefined : undefined)
      toast.success('Комисијата е предложена')
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
      title="Предложи комисија"
      description="Изберете точно 2 дополнителни професори со право на глас. Вие автоматски сте третиот (гласачки) член."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Откажи</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Предложи комисија
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
          Избрани членови со право на глас: <strong>{selectedIds.length} / 2</strong>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : mentors.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Нема достапни други професори.</p>
          ) : (
            mentors.map((m) => {
              const isSelected = selectedIds.includes(m.id)
              const isDisabled = (!isSelected && selectedIds.length >= 2) || externalId === m.id
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
                  </div>
                  {isSelected && <CheckCircle className="h-5 w-5 text-brand-600 shrink-0" />}
                </button>
              )
            })
          )}
        </div>

        {/* Optional external non-voting member — official faculty procedure, max 1 */}
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={includeExternal}
              onChange={toggleIncludeExternal}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <UserPlus className="h-4 w-4" />
            Додади надворешен член без право на глас (опционално)
          </label>
          <p className="mt-1 ml-6 text-xs text-gray-500 dark:text-gray-400">
            Надворешен член – без право на оценување. Надворешен професионалец од праксата може
            да се приклучи на комисијата и да учествува во разгледувањето, но никогаш не може да внесе оценка за одбрана.
          </p>

          {includeExternal && (
            <div className="mt-3 ml-6">
              {externalCandidates.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Нема достапни други професори.</p>
              ) : (
                <select
                  value={externalId ?? ''}
                  onChange={(e) => setExternalId(e.target.value || null)}
                  className="input-field"
                >
                  <option value="">Изберете го надворешниот член…</option>
                  {externalCandidates.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
