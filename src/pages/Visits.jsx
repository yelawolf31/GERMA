import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import StatusBadge from '../components/ui/StatusBadge'
import { Select, Input } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { fetchVisits } from '../services/visits'
import { fetchUserProfiles } from '../services/users'
import { useCustomers } from '../hooks/useCustomers'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate, formatTime, startOfDaysAgo, startOfToday } from '../utils/format'

function VisitRow({ visit, onClick }) {
  return (
    <Card>
      <button
        type="button"
        onClick={() => onClick?.(visit)}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{visit.customer?.name || '—'}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {visit.supervisor?.full_name || '—'}
              <span className="mx-1.5">·</span>
              <span dir="ltr">
                {formatDate(visit.visited_at)} {formatTime(visit.visited_at)}
              </span>
            </p>
            {visit.notes && <p className="mt-1 truncate text-xs text-slate-500">{visit.notes}</p>}
            {(visit.latitude != null || visit.longitude != null) && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3" />
                <span dir="ltr">
                  {visit.latitude?.toFixed(5)}, {visit.longitude?.toFixed(5)}
                </span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge type="condition" value={visit.refrigerator_condition} />
            <StatusBadge type="cleanliness" value={visit.cleanliness} />
          </div>
        </div>
      </button>
    </Card>
  )
}

const PAGE_SIZE = 15

export default function Visits() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const navigate = useNavigate()

  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [supervisors, setSupervisors] = useState([])
  const [range, setRange] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [supervisorId, setSupervisorId] = useState('')
  const { customers } = useCustomers()
  const [customerId, setCustomerId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(searchInput, 300)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      let from = null
      let to = null
      if (range === 'today') {
        from = startOfToday()
      } else if (range === 'yesterday') {
        from = startOfDaysAgo(1)
        to = startOfToday()
      } else if (range === '7days') {
        from = startOfDaysAgo(7)
      } else if (range === 'custom' && customDate) {
        from = new Date(`${customDate}T00:00:00`)
        const next = new Date(from)
        next.setDate(next.getDate() + 1)
        to = next
      }
      const data = await fetchVisits({ from, to, supervisorId: supervisorId || null, customerId: customerId || null })
      setVisits(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customDate, supervisorId, customerId])

  useEffect(() => {
    const loadSupervisors = async () => {
      if (role !== 'admin') return
      try {
        const data = await fetchUserProfiles()
        setSupervisors(data.filter((user) => user.role === 'supervisor'))
      } catch {
        // non-blocking
      }
    }
    loadSupervisors()
  }, [role])

  const summary = useMemo(() => {
    const today = visits.filter((v) => new Date(v.visited_at) >= startOfToday()).length
    return { total: visits.length, today }
  }, [visits])

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return visits
    const q = debouncedQuery.toLowerCase()
    return visits.filter(
      (v) =>
        v.customer?.name?.toLowerCase().includes(q) ||
        v.supervisor?.full_name?.toLowerCase().includes(q) ||
        v.notes?.toLowerCase().includes(q),
    )
  }, [visits, debouncedQuery])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title={t('visits.title')} subtitle={loading ? undefined : `${summary.total} — ${summary.today} ${t('dashboard.todayVisits').toLowerCase()}`} />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="today">{t('visits.today')}</option>
          <option value="yesterday">{t('visits.yesterday')}</option>
          <option value="7days">{t('visits.last7Days')}</option>
          <option value="custom">{t('visits.customDate')}</option>
        </Select>
        {range === 'custom' && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        )}
        {role === 'admin' && (
          <Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
            <option value="">{t('visits.allSupervisors')}</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.full_name}
              </option>
            ))}
          </Select>
        )}
        <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">{t('visits.allCustomers')}</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            className="pl-9"
            placeholder={t('common.search')}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : error ? (
          <ErrorState title={t('common.error')} message={error.message} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('visits.noResults')} />
        ) : (
          <>
            {pageItems.map((visit) => (
              <VisitRow key={visit.id} visit={visit} onClick={(v) => navigate(`/visits/${v.id}`)} />
            ))}
            {pageCount > 1 && (
              <div className="flex items-center justify-between pt-2">
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
