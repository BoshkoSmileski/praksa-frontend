/**
 * Format an ISO timestamp string (from the backend) as a human-readable
 * Macedonian-style date (dd.MM.yyyy) / date-time (dd.MM.yyyy, HH:mm).
 * Examples:
 *   formatDate('2026-05-17T18:30:00Z')      → '17.05.2026'
 *   formatDateTime('2026-05-17T18:30:00Z')  → '17.05.2026, 20:30'
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year}, ${hours}:${minutes}`
}
