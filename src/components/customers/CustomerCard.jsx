import { Store, Phone, MapPin, ChevronRight, Refrigerator } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { useTranslation } from '../../i18n'
import { formatDate } from '../../utils/format'

export default function CustomerCard({ customer, onOpen }) {
  const { t } = useTranslation()
  const refrigerators = customer.refrigerators || []

  return (
    <Card className="transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen?.(customer)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div
          className="h-11 w-11 shrink-0 rounded-full"
          style={{ backgroundColor: customer.markerColor || '#3b82f6' }}
          aria-hidden="true"
        >
          <div className="flex h-full w-full items-center justify-center text-white">
            <Store className="h-5 w-5" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-800">{customer.name}</p>
            <Badge tone={customer.status === 'active' ? 'green' : 'gray'} className="shrink-0">
              {customer.status === 'active' ? t('customers.active') : t('customers.inactive')}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {customer.phone && (
              <span className="flex items-center gap-1" dir="ltr">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[customer.commune, customer.wilaya].filter(Boolean).join(', ') || t('common.unknown')}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <Refrigerator className="h-3.5 w-3.5" />
            {refrigerators.length}
          </span>
          <span className="text-xs text-slate-400">
            {customer.lastVisitAt ? formatDate(customer.lastVisitAt) : t('customers.neverVisited')}
          </span>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
      </button>
    </Card>
  )
}
