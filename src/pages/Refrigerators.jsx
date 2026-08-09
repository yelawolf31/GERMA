import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Refrigerator as RefrigeratorIcon } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import StatusBadge from '../components/ui/StatusBadge'
import { Input, Select } from '../components/ui/Field'
import { useRefrigerators } from '../hooks/useRefrigerators'
import { useDebounce } from '../hooks/useDebounce'
import { useTranslation } from '../i18n'
import { REFRIGERATOR_STATUSES } from '../constants/statuses'

const PAGE_SIZE = 15

export default function Refrigerators() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { refrigerators, loading, error, refresh } = useRefrigerators()

  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(searchInput, 300)

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    let result = refrigerators
    if (q) {
      result = result.filter(
        (ref) =>
          (ref.serial_number || '').toLowerCase().includes(q) ||
          (ref.model || '').toLowerCase().includes(q) ||
          (ref.customer?.name || '').toLowerCase().includes(q),
      )
    }
    if (statusFilter) result = result.filter((ref) => ref.status === statusFilter)
    return result
  }, [refrigerators, debouncedQuery, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t('refrigerators.title')}
        subtitle={`${refrigerators.length} ${t('refrigerators.title').toLowerCase()}`}
        actions={
          <Button onClick={() => navigate('/refrigerators/add')}>
            <Plus className="h-4 w-4" />
            {t('refrigerators.add')}
          </Button>
        }
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="pl-9"
            placeholder={t('refrigerators.searchPlaceholder')}
          />
        </div>
        <div className="sm:w-48">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">{t('common.all')}</option>
            {Object.values(REFRIGERATOR_STATUSES).map((status) => (
              <option key={status} value={status}>
                {t(`refrigerators.${status}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="py-6">
            <p className="text-sm text-red-600">{error.message}</p>
            <Button variant="secondary" className="mt-3" onClick={refresh}>
              {t('common.retry')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={RefrigeratorIcon}
            title={t('refrigerators.noResults')}
            action={
              <Button onClick={() => navigate('/refrigerators/add')}>
                <Plus className="h-4 w-4" />
                {t('refrigerators.add')}
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {pageItems.map((refrigerator) => (
                <Card key={refrigerator.id} className="transition-shadow hover:shadow-md">
                  <button
                    type="button"
                    onClick={() => navigate(`/refrigerators/${refrigerator.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <RefrigeratorIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {refrigerator.serial_number || t('common.unknown')}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {refrigerator.customer?.name || '—'}
                        {refrigerator.model ? ` · ${refrigerator.model}` : ''}
                      </p>
                    </div>
                    <StatusBadge type="refrigerator" value={refrigerator.status} />
                  </button>
                </Card>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t('common.previous')}
                </Button>
                <span className="text-sm text-slate-500">
                  {safePage} / {pageCount}
                </span>
                <Button variant="secondary" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((p) => p + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
