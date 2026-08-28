import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { defenseApi } from '@/api/defenseApi'

interface ProposeDefenseModalProps {
  open: boolean
  onClose: () => void
  thesisId: string
  onProposed: () => void
}

/**
 * STUDENT proposes the actual defense room, date, and time. This is a PROPOSAL — it
 * requires Student Service's approval before a real defense is scheduled. The backend is
 * the authoritative validator (5-15 day window, room availability); this form only blocks
 * obviously-invalid input so the student gets fast feedback.
 */
export function ProposeDefenseModal({ open, onClose, thesisId, onProposed }: ProposeDefenseModalProps) {
  const [room, setRoom] = useState('')
  const [datetime, setDatetime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // datetime-local gives "YYYY-MM-DDTHH:mm" — backend expects ISO with timezone.
      const iso = new Date(datetime).toISOString()
      await defenseApi.createRequest(thesisId, room.trim(), iso)
      toast.success('Терминот за одбрана е предложен — чека одобрување од Студентската служба')
      onProposed()
      onClose()
      setRoom('')
      setDatetime('')
    } catch {
      // interceptor
    } finally {
      setSubmitting(false)
    }
  }

  const minDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const maxDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Предложи термин за одбрана"
      description="Предложете просторија, датум и време за вашата одбрана. Ова е предлог — Студентската служба мора да го одобри пред да биде закажан."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Откажи</button>
          <button
            type="submit"
            form="propose-defense-form"
            disabled={submitting || !room || !datetime}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Поднеси предлог
          </button>
        </>
      }
    >
      <form id="propose-defense-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Просторија <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="пр. Сала 204"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Датум и време <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            min={minDate}
            max={maxDate}
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-500">
            Мора да биде помеѓу 5 и 15 дена од денес.
          </p>
        </div>
      </form>
    </Modal>
  )
}
