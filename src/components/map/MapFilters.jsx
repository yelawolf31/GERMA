import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Checkbox from '../ui/Checkbox'
import { REFRIGERATOR_STATUSES, CUSTOMER_STATUSES } from '../../constants/statuses'
import { getRefrigeratorStatusKey, getCustomerStatusKey } from '../../utils/statusLabels'
import { VISIT_FILTERS } from '../../utils/filters'

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/**
 * Map filter panel. `filters` shape from createDefaultMapFilters().
 */
export default function MapFilters({ filters, onChange, open, onToggle }) {
  const { t } = useTranslation()

  const setRefrigeratorStatus = (value) => onChange({ ...filters, refrigeratorStatus: toggle(filters.refrigeratorStatus, value) })
  const setCustomerStatus = (value) => onChange({ ...filters, customerStatus: toggle(filters.customerStatus, value) })
  const setVisit = (value) => onChange({ ...filters, visits: toggle(filters.visits, value) })
  const setOpenIssues = (checked) => onChange({ ...filters, hasOpenIssues: checked })

  return (
    <div className="w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {t('map.filters')}
        </span>
        <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('map.refrigeratorStatus')}
            </p>
            <div className="space-y-0.5">
              {Object.values(REFRIGERATOR_STATUSES).map((status) => (
                <Checkbox
                  key={status}
                  label={t(getRefrigeratorStatusKey(status))}
                  checked={filters.refrigeratorStatus.includes(status)}
                  onChange={() => setRefrigeratorStatus(status)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('map.customerStatus')}
            </p>
            <div className="space-y-0.5">
              {Object.values(CUSTOMER_STATUSES).map((status) => (
                <Checkbox
                  key={status}
                  label={t(getCustomerStatusKey(status))}
                  checked={filters.customerStatus.includes(status)}
                  onChange={() => setCustomerStatus(status)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('map.visits')}</p>
            <div className="space-y-0.5">
              <Checkbox
                label={t('map.visitedToday')}
                checked={filters.visits.includes(VISIT_FILTERS.VISITED_TODAY)}
                onChange={() => setVisit(VISIT_FILTERS.VISITED_TODAY)}
              />
              <Checkbox
                label={t('map.notVisitedToday')}
                checked={filters.visits.includes(VISIT_FILTERS.NOT_VISITED_TODAY)}
                onChange={() => setVisit(VISIT_FILTERS.NOT_VISITED_TODAY)}
              />
              <Checkbox
                label={t('map.notVisited7Days')}
                checked={filters.visits.includes(VISIT_FILTERS.NOT_VISITED_7_DAYS)}
                onChange={() => setVisit(VISIT_FILTERS.NOT_VISITED_7_DAYS)}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('map.issues')}</p>
            <Checkbox
              label={t('map.hasOpenIssues')}
              checked={filters.hasOpenIssues}
              onChange={setOpenIssues}
            />
          </div>

          <button
            type="button"
            onClick={() => onChange({ refrigeratorStatus: [], customerStatus: [], visits: [], hasOpenIssues: false })}
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            {t('common.reset')}
          </button>
        </div>
      )}
    </div>
  )
}
