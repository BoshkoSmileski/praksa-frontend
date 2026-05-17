import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { defenseApi } from '@/api/defenseApi'

interface ScheduleDefenseModalProps {
  open: boolean
  onClose: () => void
  thesisId: string
  onScheduled: () => void
}

export function ScheduleDefenseModal({ open, onClose, thesisId, onScheduled }: ScheduleDefenseModalProps) {
  const [room, setRoom] = useState('')
  const [datetime, setDatetime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // datetime-local gives "YYYY-MM-DDTHH:mm" — backend expects ISO with timezone.
      // Convert via Date → ISO string with milliseconds and Z.
      const iso = new Date(datetime).toISOString()
      await defenseApi.schedule(thesisId, room.trim(), iso)
      toast.success('Defense scheduled')
      onScheduled()
      onClose()
      setRoom('')
      setDatetime('')
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
      title="Schedule Defense"
      description="Set the room and date/time for the thesis defense."
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="submit"
            form="schedule-form"
            disabled={submitting || !room || !datetime}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule
          </button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Room <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. Hall 204"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            min={new Date().toISOString().slice(0, 16)}
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-500">Must be in the future.</p>
        </div>
      </form>
    </Modal>
  )
}
