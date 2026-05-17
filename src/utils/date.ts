/**
 * Format an ISO timestamp string (from the backend) as a human-readable date.
 * Examples:
 *   formatDate('2026-05-17T18:30:00Z')      → 'May 17, 2026'
 *   formatDateTime('2026-05-17T18:30:00Z')  → 'May 17, 2026, 8:30 PM'
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
