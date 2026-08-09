import { useState } from 'react'
import { useTranslation } from '../../i18n'
import { REFRIGERATOR_STATUSES } from '../../constants/statuses'
import { useToast } from '../../hooks/useToast'

const STATUS_OPTIONS = [
  { value: REFRIGERATOR_STATUSES.WORKING, dot: 'bg-emerald-500', labelKey: 'refrigerators.working' },
  { value: REFRIGERATOR_STATUSES.NEEDS_MAINTENANCE, dot: 'bg-orange-500', labelKey: 'refrigerators.needsMaintenance' },
  { value: REFRIGERATOR_STATUSES.BROKEN, dot: 'bg-red-500', labelKey: 'refrigerators.broken' },
  { value: REFRIGERATOR_STATUSES.REMOVED, dot: 'bg-slate-400', labelKey: 'refrigerators.removed' },
]

/**
 * Status change control. Updating refreshes the DB (audit triggered server-side).
 */
export default function RefrigeratorStatusSelect({ currentStatus, onChange, disabled = false }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleChange = async (status) => {
    if (status === currentStatus || saving) return
    setSaving(true)
    try {
      await onChange(status)
      toast.success(t('refrigerators.statusUpdated'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">{t('refrigerators.currentStatus')} :</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_OPTIONS.find((o) => o.value === currentStatus)?.dot || 'bg-slate-400'}`} />
          {t(`refrigerators.${currentStatus}`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUS_OPTIONS.map((option) => {
          const isActive = option.value === currentStatus
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled || saving}
              onClick={() => handleChange(option.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${option.dot}`} />
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
