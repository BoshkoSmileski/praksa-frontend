import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
}

/**
 * Animated placeholder for loading content.
 * Usage: <Skeleton className="h-4 w-32" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
    />
  )
}
