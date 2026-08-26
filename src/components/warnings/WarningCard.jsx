import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import { useTranslation } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/format'

export default function WarningCard({ warning, onDismiss }) {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
      warning.dismissed ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-red-200 bg-red-50'
    }`}>
      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warning.dismissed ? 'text-slate-400' : 'text-red-500'}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${warning.dismissed ? 'text-slate-500' : 'text-slate-800'}`}>
          {warning.reason}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>{warning.issued_by_user?.full_name || '—'}</span>
          <span>{formatDateTime(warning.created_at)}</span>
          {warning.dismissed && warning.dismissed_by_user && (
            <span className="text-slate-400">
              · {t('warnings.dismissed')} par {warning.dismissed_by_user.full_name}
            </span>
          )}
        </div>
      </div>
      {!warning.dismissed && isAdmin && onDismiss && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDismiss(warning.id)}
          className="shrink-0 text-xs"
        >
          {t('warnings.dismiss')}
        </Button>
      )}
    </div>
  )
}
