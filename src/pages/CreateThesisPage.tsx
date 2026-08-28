import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { userApi } from '@/api/userApi'
import { PageHeader } from '@/components/ui/PageHeader'

const REQUIRED_CREDITS = 200

export function CreateThesisPage() {
  const [title, setTitle] = useState('')
  const [studentComment, setStudentComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [creditsLoaded, setCreditsLoaded] = useState(false)
  const navigate = useNavigate()

  // Load the student's own credit balance so we can warn them before they try.
  // This is a usability hint only — the backend enforces the 200-credit gate.
  useEffect(() => {
    userApi
      .getMe()
      .then((me) => setCredits(me.credits))
      .catch(() => setCredits(null))
      .finally(() => setCreditsLoaded(true))
  }, [])

  const eligible = credits != null && credits >= REQUIRED_CREDITS

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const thesis = await thesisApi.create({
        title: title.trim(),
        studentComment: studentComment.trim() || undefined,
      })
      toast.success('Дипломската работа е креирана — побарана е проверка на условите')
      navigate(`/theses/${thesis.id}`)
    } catch {
      // Interceptor toast
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/theses')}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад кон дипломски работи
      </button>

      <PageHeader
        title="Нова дипломска работа"
        description="Поднесете го насловот на дипломската работа за да побарате проверка на условите."
      />

      {/* Credit status — usability hint; the backend enforces the 200-credit gate */}
      {creditsLoaded && (
        eligible ? (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900 dark:bg-green-950 dark:border-green-900 dark:text-green-200">
            Имате <span className="font-semibold">{credits}</span> кредити — ги исполнувате условите од {REQUIRED_CREDITS}{' '}
            кредити за поднесување пријава за дипломска работа.
          </div>
        ) : (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Сè уште не можете да поднесете пријава за дипломска работа.</p>
              <p className="mt-1">
                Потребни се најмалку {REQUIRED_CREDITS} кредити. Моментално имате{' '}
                <span className="font-semibold">{credits ?? 'ненаведени'}</span> кредити. Контактирајте ја Студентската служба за
                да ги внесе или ажурира вашите кредити.
              </p>
            </div>
          </div>
        )
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Наслов на дипломската работа <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={5}
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="пр. Пристапи на машинско учење за препознавање слики"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Помеѓу 5 и 255 карактери
          </p>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Забелешки <span className="text-gray-400 font-normal">(опционално)</span>
          </label>
          <textarea
            id="comment"
            rows={4}
            value={studentComment}
            onChange={(e) => setStudentComment(e.target.value)}
            className="input-field resize-none"
            placeholder="Додадете краток опис на вашата идеја..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/theses')}
            className="btn-secondary"
          >
            Откажи
          </button>
          <button
            type="submit"
            disabled={submitting || (creditsLoaded && !eligible)}
            title={creditsLoaded && !eligible ? `Потребни се најмалку ${REQUIRED_CREDITS} кредити` : undefined}
            className="btn-primary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Креирање...' : 'Креирај дипломска работа'}
          </button>
        </div>
      </form>

      <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
        <p className="font-medium">Што следува?</p>
        <p className="mt-1 text-blue-800 dark:text-blue-300">
          Студентската служба ќе го разгледа вашето барање за проверка на условите (потребни се најмалку 200 кредити).
          Откако ќе биде одобрено, ќе можете да изберете ментор и тема.
        </p>
      </div>
    </div>
  )
}
