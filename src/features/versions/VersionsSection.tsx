import { useEffect, useState } from 'react'
import { Download, Star, ChevronDown, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { versionApi } from '@/api/versionApi'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/utils/date'
import { cn } from '@/utils/cn'
import { VersionUploader } from './VersionUploader'
import { CommentList } from './CommentList'
import type { Thesis, ThesisVersion } from '@/types/api'

interface VersionsSectionProps {
  thesis: Thesis
  // Parent should refresh thesis after mark-final since status can change
  onThesisChange?: () => void
}

export function VersionsSection({ thesis, onThesisChange }: VersionsSectionProps) {
  const [versions, setVersions] = useState<ThesisVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [markingFinalId, setMarkingFinalId] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    versionApi
      .list(thesis.id)
      .then(setVersions)
      .finally(() => setLoading(false))
  }, [thesis.id])

  const isStudentOwner = user?.role === 'STUDENT' && thesis.studentId === user.id
  const canUpload = isStudentOwner && (thesis.status === 'IN_PROGRESS' || thesis.status === 'FINAL_SUBMITTED')
  const canMarkFinal = isStudentOwner && thesis.status === 'IN_PROGRESS'

  const handleUploaded = (version: ThesisVersion) => {
    setVersions((prev) => [...prev, version])
  }

  const handleDownload = async (version: ThesisVersion) => {
    try {
      const blob = await versionApi.downloadBlob(thesis.id, version.id)
      // Trick to trigger a browser download from a Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thesis-v${version.versionNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // interceptor
    }
  }

  const handleMarkFinal = async (version: ThesisVersion) => {
    setMarkingFinalId(version.id)
    try {
      await versionApi.markFinal(thesis.id, version.id)
      // Refresh both the version list (other version's isFinal may have changed) and parent thesis
      const fresh = await versionApi.list(thesis.id)
      setVersions(fresh)
      toast.success(`Version ${version.versionNumber} marked as final`)
      onThesisChange?.()
    } catch {
      // interceptor
    } finally {
      setMarkingFinalId(null)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Thesis Versions
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'}
        </span>
      </div>

      {canUpload && (
        <div className="mb-4">
          <VersionUploader thesisId={thesis.id} onUploaded={handleUploaded} />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : versions.length === 0 ? (
        <p className="text-sm text-gray-500 italic dark:text-gray-400">
          No versions uploaded yet
          {canUpload && ' — upload your first PDF above'}
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => {
            const isExpanded = expandedId === v.id
            return (
              <div
                key={v.id}
                className={cn(
                  'rounded-lg border transition-colors',
                  v.isFinal
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="rounded-md bg-gray-100 p-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Version {v.versionNumber}
                      </p>
                      {v.isFinal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900">
                          <Star className="h-3 w-3" />
                          Final
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Uploaded {formatDateTime(v.uploadedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canMarkFinal && !v.isFinal && (
                      <button
                        onClick={() => handleMarkFinal(v)}
                        disabled={markingFinalId === v.id}
                        className="btn-secondary"
                        title="Mark this version as the final submission"
                      >
                        {markingFinalId === v.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Star className="h-3.5 w-3.5" />
                        )}
                        Mark Final
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(v)}
                      className="btn-secondary"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Show comments"
                    >
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                      />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-700">
                    <CommentList thesisId={thesis.id} versionId={v.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
