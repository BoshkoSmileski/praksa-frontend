import { useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-4 border-b border-gray-200 bg-white/80 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      {user && (
        <>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-100 p-2 dark:bg-brand-900">
              <UserIcon className="h-4 w-4 text-brand-700 dark:text-brand-200" />
            </div>
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.fullName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </>
      )}
    </header>
  )
}
