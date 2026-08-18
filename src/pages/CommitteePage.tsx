import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ArrowRight, User as UserIcon, Star } from 'lucide-react'
import { thesisApi } from '@/api/thesisApi'
import { committeeApi } from '@/api/committeeApi'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Thesis, CommitteeMember } from '@/types/api'

// A small badge that describes the caller's involvement on this thesis's committee.
// Populated lazily per-card via the committee list endpoint.
type MembershipInfo = {
  isMentorMember: boolean
  isFormalMember: boolean
  hasSubmittedNotes: boolean
  members: CommitteeMember[]
}

export function CommitteePage() {
  const user = useAuthStore((s) => s.user)
  const [theses, setTheses] = useState<Thesis[]>([])
  const [memberships, setMemberships] = useState<Record<string, MembershipInfo>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    thesisApi
      .getCommittee()
      .then(async (list) => {
        if (cancelled) return
        setTheses(list)
        // Kick off per-thesis committee membership lookup in parallel.
        // The backend already scopes the list to a small set of relevant theses,
        // so N+1 here is bounded and acceptable.
        const results = await Promise.all(
          list.map(async (t) => {
            try {
              const members = await committeeApi.list(t.id)
              const mine = members.find((m) => m.professorId === user?.id)
              return [
                t.id,
                {
                  isMentorMember: mine?.memberRole === 'MENTOR_MEMBER',
                  isFormalMember: mine?.memberRole === 'FORMAL_MEMBER',
                  hasSubmittedNotes: !!mine?.notes,
                  members,
                },
              ] as const
            } catch {
              return [t.id, { isMentorMember: false, isFormalMember: false, hasSubmittedNotes: false, members: [] }] as const
            }
          }),
        )
        if (cancelled) return
        setMemberships(Object.fromEntries(results))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const description = useMemo(() => {
    if (user?.role === 'MENTOR') return 'Theses you mentor or serve on as a committee member'
    if (user?.role === 'STUDENT_SERVICE') return 'Theses in the committee formation and review flow'
    if (user?.role === 'COMMITTEE') return 'Theses with a scheduled defense you may grade'
    return 'Committee overview'
  }, [user?.role])

  return (
    <div>
      <PageHeader
        title="Committee"
        description={description}
      />

      {loading ? (
        <LoadingList />
      ) : theses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Nothing on your committee list"
            description="When a thesis reaches the committee stage or a defense is scheduled, it will appear here."
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {theses.map((thesis) => (
            <CommitteeThesisCard
              key={thesis.id}
              thesis={thesis}
              membership={memberships[thesis.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────

function CommitteeThesisCard({
  thesis,
  membership,
}: {
  thesis: Thesis
  membership: MembershipInfo | undefined
}) {
  const memberCount = membership?.members.length ?? 0
  const notesSubmitted = membership?.members.filter((m) => m.notes).length ?? 0

  return (
    <Link
      to={`/theses/${thesis.id}`}
      className="card group block p-5 hover:ring-2 hover:ring-brand-500 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={thesis.status} />
            {membership?.isMentorMember && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                <Star className="h-3 w-3" />
                Mentor Member
              </span>
            )}
            {membership?.isFormalMember && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                <Users className="h-3 w-3" />
                Formal Member
              </span>
            )}
            {membership?.isFormalMember && thesis.status === 'COMMITTEE_REVIEW' && !membership.hasSubmittedNotes && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Action needed: submit review
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate group-hover:text-brand-600">
            {thesis.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              {thesis.studentName}
            </span>
            {thesis.mentorName && (
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">·</span>
                Mentor: {thesis.mentorName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="text-gray-400">·</span>
              Committee: {memberCount}/3
              {memberCount > 0 && <> · {notesSubmitted} note{notesSubmitted === 1 ? '' : 's'}</>}
            </span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </Link>
  )
}

function LoadingList() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
