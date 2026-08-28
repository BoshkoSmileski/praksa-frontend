import type { Role } from '@/types/api'

/**
 * Macedonian display labels for the backend Role enum. Single source of truth so
 * every place that shows a role (header, sidebar, pickers, tables) stays consistent.
 * The Role string union itself is never renamed — only the label shown to the user.
 */
export const roleLabels: Record<Role, string> = {
  STUDENT: 'Студент',
  MENTOR: 'Ментор',
  STUDENT_SERVICE: 'Студентска служба',
  COMMITTEE: 'Член на комисија',
  ARCHIVE: 'Архива',
}

export function roleLabel(role: Role): string {
  return roleLabels[role] ?? role
}
