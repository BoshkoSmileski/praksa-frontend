import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { UploadCloud, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { versionApi } from '@/api/versionApi'
import { cn } from '@/utils/cn'
import type { ThesisVersion } from '@/types/api'

interface VersionUploaderProps {
  thesisId: string
  onUploaded: (version: ThesisVersion) => void
}

/**
 * Drag-and-drop PDF uploader with progress bar.
 *
 * Why we validate twice (client and server):
 *   - Client validation = fast user feedback, no wasted bandwidth
 *   - Server validation = security (anyone can bypass client-side checks)
 */
export function VersionUploader({ thesisId, onUploaded }: VersionUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    // Client-side validation — server has the same checks
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum is 20 MB')
      return
    }

    setUploading(true)
    setCurrentFile(file.name)
    setProgress(0)

    try {
      const version = await versionApi.upload(thesisId, file, setProgress)
      toast.success(`Version ${version.versionNumber} uploaded`)
      onUploaded(version)
    } catch {
      // interceptor toast
    } finally {
      setUploading(false)
      setCurrentFile(null)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
            : 'border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-brand-500 dark:hover:bg-brand-950/30',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploading {currentFile}...
            </p>
            <div className="w-full max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-brand-600 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
                {progress}%
              </p>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="text-brand-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF only · max 20 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  )
}
