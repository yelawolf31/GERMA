import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'

export default function WarningBadge({ count }) {
  const { t } = useTranslation()
  if (!count || count <= 0) return null

  const label = count === 1 ? t('warnings.countSingular') : t('warnings.count').replace('{count}', count)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      <span className="text-sm font-medium text-red-700">{label}</span>
    </div>
  )
}
