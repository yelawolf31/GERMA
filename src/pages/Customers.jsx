import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Download } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import CustomerCard from '../components/customers/CustomerCard'
import { Select, Input } from '../components/ui/Field'
import { useMapData } from '../hooks/useMapData'
import { useDebounce } from '../hooks/useDebounce'
import { useTranslation } from '../i18n'
import { CUSTOMER_STATUSES } from '../constants/statuses'
import { matchesCustomerSearch } from '../utils/filters'
import { exportCsv } from '../utils/export'
import { getCustomerStatusKey } from '../utils/statusLabels'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 15

export default function Customers() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customers, loading, error, refresh } = useMapData()

  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(searchInput, 300)

  const filtered = useMemo(() => {
    let result = customers.filter((customer) => matchesCustomerSearch(customer, debouncedQuery))
    if (statusFilter) result = result.filter((customer) => customer.status === statusFilter)
    return result
  }, [customers, debouncedQuery, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const resetPage = () => setPage(1)

  const handleExport = () => {
    exportCsv(
      'customers.csv',
      [
        t('customers.name'),
        t('common.phone'),
        t('common.location'),
        t('customers.wilaya'),
        t('customers.commune'),
        t('common.status'),
        t('customers.refrigerators'),
        t('customers.lastVisit'),
        t('dashboard.openIssues'),
      ],
      filtered.map((c) => [
        c.name,
        c.phone || '',
        [c.commune, c.wilaya].filter(Boolean).join(', '),
        c.wilaya || '',
        c.commune || '',
        t(getCustomerStatusKey(c.status)),
        c.refrigerators.length,
        c.lastVisitAt ? formatDate(c.lastVisitAt) : '',
        c.openIssueCount || 0,
      ]),
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t('customers.title')}
        subtitle={loading ? undefined : `${customers.length} ${t('customers.title').toLowerCase()}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" />
              {t('common.export')}
            </Button>
            <Button onClick={() => navigate('/customers/add')}>
              <Plus className="h-4 w-4" />
              {t('customers.add')}
            </Button>
          </div>
        }
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              resetPage()
            }}
            className="pl-9"
            placeholder={t('customers.searchPlaceholder')}
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              resetPage()
            }}
          >
            <option value="">{t('common.all')}</option>
            <option value={CUSTOMER_STATUSES.ACTIVE}>{t('customers.active')}</option>
            <option value={CUSTOMER_STATUSES.INACTIVE}>{t('customers.inactive')}</option>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[76px] w-full" />
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
            title={t('customers.noResults')}
            description={t('common.search')}
            action={
              <Button onClick={() => navigate('/customers/add')}>
                <Plus className="h-4 w-4" />
                {t('customers.add')}
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {pageItems.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onOpen={(item) => navigate(`/customers/${item.id}`)}
                />
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
