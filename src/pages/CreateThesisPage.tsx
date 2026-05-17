import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { thesisApi } from '@/api/thesisApi'
import { PageHeader } from '@/components/ui/PageHeader'

export function CreateThesisPage() {
  const [title, setTitle] = useState('')
  const [studentComment, setStudentComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const thesis = await thesisApi.create({
        title: title.trim(),
        studentComment: studentComment.trim() || undefined,
      })
      toast.success('Thesis created — eligibility check requested')
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
        Back to theses
      </button>

      <PageHeader
        title="Create New Thesis"
        description="Submit your thesis title to request the eligibility check."
      />

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Thesis Title <span className="text-red-500">*</span>
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
            placeholder="e.g. Machine Learning Approaches to Image Recognition"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Between 5 and 255 characters
          </p>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="comment"
            rows={4}
            value={studentComment}
            onChange={(e) => setStudentComment(e.target.value)}
            className="input-field resize-none"
            placeholder="Add a short description of your idea..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/theses')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Creating...' : 'Create Thesis'}
          </button>
        </div>
      </form>

      <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">
        <p className="font-medium">What happens next?</p>
        <p className="mt-1 text-blue-800 dark:text-blue-300">
          The student service will review your eligibility request (must have at least 200 credits).
          Once approved, you'll be able to select a mentor and topic.
        </p>
      </div>
    </div>
  )
}
