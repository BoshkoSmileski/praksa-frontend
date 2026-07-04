// =============================================================================
// API types — mirror the Java DTOs from the Spring Boot backend.
// Keep this file in sync when backend DTOs change.
// =============================================================================

// Standard envelope used by every backend response
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// -----------------------------------------------------------------------------
// Enums (string unions match Java enum names)
// -----------------------------------------------------------------------------

export type Role = 'STUDENT' | 'MENTOR' | 'STUDENT_SERVICE' | 'COMMITTEE' | 'ARCHIVE'

export type ThesisStatus =
  | 'PENDING_ELIGIBILITY_CHECK'
  | 'ELIGIBILITY_REJECTED'
  | 'TOPIC_SELECTION'
  | 'PENDING_MENTOR_APPROVAL'
  | 'MENTOR_REQUESTED_CHANGES'
  | 'MENTOR_REJECTED_TOPIC'
  | 'APPLICATION_SUBMITTED'
  | 'PENDING_ARCHIVE_VALIDATION'
  | 'APPLICATION_REJECTED_BY_ARCHIVE'
  | 'PENDING_SERVICE_VALIDATION'
  | 'APPLICATION_REJECTED_BY_SERVICE'
  | 'IN_PROGRESS'
  | 'FINAL_SUBMITTED'
  | 'MENTOR_APPROVED'
  | 'COMMITTEE_REVIEW'
  | 'COMMITTEE_ACCEPTED'
  | 'PENDING_DEFENSE_CHECK'
  | 'DEFENSE_SCHEDULED'
  | 'ARCHIVED'

export type MemberRole = 'MENTOR_MEMBER' | 'FORMAL_MEMBER'

export type MentorDecision = 'ACCEPT' | 'REJECT' | 'REQUEST_CHANGES'

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  role: Role
  indexNumber?: string
}

export interface AuthResponse {
  token: string
  userId: string
  email: string
  fullName: string
  role: Role
}

// -----------------------------------------------------------------------------
// User summary (for pickers/dropdowns)
// -----------------------------------------------------------------------------

export interface UserSummary {
  id: string
  email: string
  fullName: string
  role: Role
}

// -----------------------------------------------------------------------------
// Thesis
// -----------------------------------------------------------------------------

export interface Thesis {
  id: string
  title: string
  status: ThesisStatus
  revisionCount: number
  studentId: string
  studentName: string
  mentorId: string | null
  mentorName: string | null
  studentComment: string | null
  mentorComment: string | null
  archiveComment: string | null
  serviceComment: string | null
  submissionDeadline: string | null
  createdAt: string
  updatedAt: string

  // Archive metadata — null until thesis is ARCHIVED
  archiveRegistrationNumber: string | null
  archiveDate: string | null
  archivedById: string | null
  archivedByName: string | null
  archiveNotes: string | null

  // Whether the application PDF has been generated and is downloadable
  hasApplicationPdf: boolean
}

export interface CreateThesisRequest {
  title: string
  studentComment?: string
}

export interface ThesisStatusHistory {
  id: string
  oldStatus: ThesisStatus | null
  newStatus: ThesisStatus
  changedById: string | null
  changedByName: string | null
  changedAt: string
}

// -----------------------------------------------------------------------------
// Versions & comments
// -----------------------------------------------------------------------------

export interface ThesisVersion {
  id: string
  thesisId: string
  versionNumber: number
  isFinal: boolean
  uploadedAt: string
  downloadUrl: string
}

export interface ThesisComment {
  id: string
  versionId: string
  authorId: string
  authorName: string
  authorRole: Role
  content: string
  createdAt: string
}

// -----------------------------------------------------------------------------
// Committee
// -----------------------------------------------------------------------------

export interface CommitteeMember {
  id: string
  thesisId: string
  professorId: string
  professorName: string
  memberRole: MemberRole
  proposedById: string | null
  proposedByName: string | null
  approvedById: string | null
  approvedAt: string | null
  notes: string | null
}

// -----------------------------------------------------------------------------
// Defense
// -----------------------------------------------------------------------------

export interface Defense {
  id: string
  thesisId: string
  room: string
  scheduledAt: string
  isCancelled: boolean
  cancelledById: string | null
  cancelledByName: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface DefenseResult {
  id: string
  defenseId: string
  thesisId: string
  grade: number
  notes: string | null
  recordedById: string | null
  recordedByName: string | null
  recordedAt: string
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

export interface Notification {
  id: string
  thesisId: string | null
  thesisTitle: string | null
  type: string
  isSent: boolean
  sentAt: string | null
  createdAt: string
}
