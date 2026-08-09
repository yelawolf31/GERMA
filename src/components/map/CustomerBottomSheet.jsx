import { Store, Phone, Navigation, ClipboardList } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import Button from '../ui/Button'
import { useTranslation } from '../../i18n'
import { formatDate } from '../../utils/format'
import { REFRIGERATOR_STATUSES } from '../../constants/statuses'

/**
 * Bottom sheet shown when a customer marker is tapped on the map.
 * On desktop this renders as a side panel.
 */
export default function CustomerBottomSheet({ customer, open, onClose, onOpenDetails, onDirections, onRecordVisit }) {
  const { t } = useTranslation()
  if (!customer) return null

  const refrigerators = customer.refrigerators || []
  const workingCount = refrigerators.filter((r) => r.status === REFRIGERATOR_STATUSES.WORKING).length
  const brokenCount = refrigerators.filter(
    (r) => r.status === REFRIGERATOR_STATUSES.BROKEN || r.status === REFRIGERATOR_STATUSES.NEEDS_MAINTENANCE,
  ).length

  const locationLabel = [customer.commune, customer.wilaya].filter(Boolean).join(', ')

  return (
    <BottomSheet open={open} onClose={onClose} title={customer.name || t('customers.details')}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-slate-600">
            <Store className="h-4 w-4" />
            <span className="text-sm">
              {[customer.business_type, locationLabel].filter(Boolean).join(' · ') || t('common.unknown')}
            </span>
          </div>
          {customer.phone && (
            <div className="mt-1 flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4" />
              <span className="text-sm" dir="ltr">
                {customer.phone}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{t('customers.refrigerators')}</span>
            <span className="font-semibold text-slate-900">{refrigerators.length}</span>
          </div>
          {refrigerators.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                {workingCount} {t('refrigerators.working')}
              </span>
              {brokenCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                  {brokenCount} {t('issues.open')}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{t('map.lastVisit')}</span>
          <span className="font-medium text-slate-700">
            {customer.lastVisitAt ? formatDate(customer.lastVisitAt) : t('customers.neverVisited')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button variant="primary" onClick={() => onOpenDetails(customer)} className="w-full">
            {t('map.openDetails')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => onDirections(customer)} className="w-full">
              <Navigation className="h-4 w-4" />
              {t('map.directions')}
            </Button>
            <Button variant="success" onClick={() => onRecordVisit(customer)} className="w-full">
              <ClipboardList className="h-4 w-4" />
              {t('customers.recordVisit')}
            </Button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
