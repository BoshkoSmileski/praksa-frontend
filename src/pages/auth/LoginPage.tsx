import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  // Where to go after a successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const auth = await authApi.login({ email, password })
      login(auth.token, {
        id: auth.userId,
        email: auth.email,
        fullName: auth.fullName,
        role: auth.role,
      })
      toast.success(`Welcome back, ${auth.fullName}!`)
      navigate(from, { replace: true })
    } catch {
      // Error toast already shown by axios interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Use your university credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-9"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <p className="font-medium mb-1">Test accounts (password: <code className="font-mono">password123</code>):</p>
        <ul className="space-y-0.5 font-mono text-[11px]">
          <li>student@test.com</li>
          <li>mentor@test.com</li>
          <li>admin@test.com</li>
        </ul>
      </div>
    </div>
  )
}
