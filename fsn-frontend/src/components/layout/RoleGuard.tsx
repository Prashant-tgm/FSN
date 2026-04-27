import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/lib/types'

interface RoleGuardProps {
  allowed: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({ allowed, children, fallback }: RoleGuardProps) {
  const user = useAuthStore(s => s.user)

  if (!user || !allowed.includes(user.role)) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-4xl">🚫</span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-ink-400 max-w-xs">
          Your current role ({user?.role ?? 'guest'}) doesn't have permission to view this page.
        </p>
        <a href="/" className="mt-6 btn-dark px-6 py-2.5 rounded-full text-sm font-body font-medium inline-flex items-center gap-2">
          ← Back to Home
        </a>
      </div>
    )
  }

  return <>{children}</>
}
