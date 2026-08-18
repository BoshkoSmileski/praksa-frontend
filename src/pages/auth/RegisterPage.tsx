import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, User, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api/authApi'

/**
 * Public self-registration page.
 *
 * Security note: public self-registration is intentionally limited to the
 * STUDENT role. Privileged accounts (MENTOR, STUDENT_SERVICE, COMMITTEE,
 * ARCHIVE) are provisioned through administrative/seed mechanisms, never
 * through this public form, so no role selector is exposed here and the
 * request always sends role = 'STUDENT'.
 *
 * The backend is the security boundary: as of the BUG-2 / P0.2 fix,
 * AuthServiceImpl.register ignores any requested role and always creates a
 * STUDENT, so a direct API call cannot escalate privilege either. This form
 * omitting the role selector is a UX choice on top of that enforcement.
 *
 * On success we do NOT auto-authenticate; we show a confirmation and send the
 * user to /login, matching the project's existing login-first auth flow.
 */
export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [indexNumber, setIndexNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Lightweight client-side validation (the backend is still authoritative).
    if (!fullName.trim() || !email.trim() || !password || !indexNumber.trim()) {
      toast.error('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role: 'STUDENT', // public registration is students only
        indexNumber: indexNumber.trim(),
      })
      toast.success('Account created! Please sign in.')
      navigate('/login', { replace: true })
    } catch {
      // Error toast (duplicate email/index, validation, server) already shown
      // by the axios response interceptor.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Register as a student to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full name
          </label>
          <div className="relative mt-1">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field pl-9"
              placeholder="Jane Student"
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-9"
              placeholder="you@university.edu"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="indexNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Student index
          </label>
          <div className="relative mt-1">
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="indexNumber"
              type="text"
              required
              value={indexNumber}
              onChange={(e) => setIndexNumber(e.target.value)}
              className="input-field pl-9"
              placeholder="2024/001"
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-9"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            At least 8 characters.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Public registration is for <span className="font-medium">students</span> only.
        Mentor, student-service, committee, and archive accounts are created by the
        faculty administration.
      </div>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </div>
  )
}
