import { useEffect, useState, type FormEvent } from 'react'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { versionApi } from '@/api/versionApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { ThesisComment } from '@/types/api'

interface CommentListProps {
  thesisId: string
  versionId: string
}

export function CommentList({ thesisId, versionId }: CommentListProps) {
  const [comments, setComments] = useState<ThesisComment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const currentUser = useAuthStore((s) => s.user)

  useEffect(() => {
    versionApi
      .listComments(thesisId, versionId)
      .then(setComments)
      .finally(() => setLoading(false))
  }, [thesisId, versionId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const newComment = await versionApi.addComment(thesisId, versionId, trimmed)
      setComments((prev) => [...prev, newComment])
      setContent('')
    } catch {
      // interceptor toast
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Comments list */}
      {loading ? (
        <>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-4/5" />
        </>
      ) : comments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-gray-500 italic dark:text-gray-400">
          <MessageSquare className="h-4 w-4" />
          No comments yet
        </p>
      ) : (
        comments.map((c) => {
          const isOwn = c.authorId === currentUser?.id
          return (
            <div
              key={c.id}
              className={cn(
                'rounded-lg p-3',
                isOwn
                  ? 'bg-brand-50 dark:bg-brand-950/40'
                  : 'bg-gray-50 dark:bg-gray-800/60'
              )}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {c.authorName}
                </p>
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {c.authorRole}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {formatDateTime(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          )
        })
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 pt-2">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          maxLength={2000}
          className="input-field resize-none"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="btn-primary"
          title="Send"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  )
}
