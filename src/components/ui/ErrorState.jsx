import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import { useTranslation } from '../../i18n'

export default function ErrorState({ title, message, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-red-800">{title || t('common.error')}</p>
      {message && <p className="max-w-sm text-sm text-red-600">{message}</p>}
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
