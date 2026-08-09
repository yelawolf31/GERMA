import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'

/**
 * Guards routes that require an authenticated session.
 */
export function ProtectedRoute() {
  const { session, loading, initialized } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label={t('auth.loadingSession')} />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

/**
 * Guards routes that require a specific role.
 * Renders an unauthorized message instead of silently redirecting.
 */
export function RoleRoute({ roles = [] }) {
  const { role } = useAuth()
  const { t } = useTranslation()

  if (!roles.includes(role)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-semibold text-slate-700">{t('auth.unauthorized')}</p>
        <p className="text-xs text-slate-500">{role || '—'}</p>
      </div>
    )
  }

  return <Outlet />
}
