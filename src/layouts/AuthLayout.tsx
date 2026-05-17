import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

/**
 * Centered, minimal layout used for login/register pages.
 * No sidebar, no header — just a logo and a card.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="rounded-xl bg-brand-600 p-3 shadow-lg shadow-brand-600/30">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              DiplomaSystem
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              University thesis management
            </p>
          </div>
        </div>

        <div className="card p-8">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} DiplomaSystem
        </p>
      </div>
    </div>
  )
}
