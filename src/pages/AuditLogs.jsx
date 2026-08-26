import { useCallback, useEffect, useState } from 'react'
import { ScrollText, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'
import { useTranslation } from '../i18n'
import { fetchAuditLogs } from '../services/audit'
import { formatDateTime } from '../utils/format'

const ACTION_TONE = {
  CREATE: 'green',
  UPDATE: 'orange',
  DELETE: 'red',
  photo_upload: 'blue',
  photo_delete: 'red',
  LOGIN: 'green',
  LOGOUT: 'slate',
}

const ENTITY_TYPES = [
  'customer',
  'refrigerator',
  'visit',
  'issue',
  'visit_photo',
  'issue_photo',
  'customer_photo',
  'refrigerator_photo',
  'user',
  'profile',
  'auth',
  'product',
]

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'photo_upload', 'photo_delete', 'LOGIN', 'LOGOUT']

const PAGE_SIZE = 15

function PrettyJson({ data }) {
  if (!data) return <span className="text-slate-400">—</span>
  let parsed = data
  try {
    if (typeof data === 'string') parsed = JSON.parse(data)
  } catch {
    parsed = data
  }
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
      {JSON.stringify(parsed, null, 1)}
    </pre>
  )
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  )
}

export default function AuditLogs() {
  const { t } = useTranslation()

  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [filterEntity, setFilterEntity] = useState(null)
  const [filterAction, setFilterAction] = useState(null)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        entityType: filterEntity,
        action: filterAction,
        dateFrom: filterDateFrom || null,
        dateTo: filterDateTo || null,
        userId: filterUser || null,
        search: filterSearch || null,
      }
      const result = await fetchAuditLogs(params)
      setLogs(result.logs)
      setTotal(result.total)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [page, filterEntity, filterAction, filterDateFrom, filterDateTo, filterUser, filterSearch])

  useEffect(() => {
    load()
  }, [load])

  const resetFilters = () => {
    setFilterEntity(null)
    setFilterAction(null)
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterUser('')
    setFilterSearch('')
    setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = filterEntity || filterAction || filterDateFrom || filterDateTo || filterUser || filterSearch

  const entityOptions = ENTITY_TYPES.map((e) => ({
    value: e,
    label: t(`audit.entity_${e}`) || e.replace(/_/g, ' '),
  }))

  const actionOptions = ACTIONS.map((a) => ({
    value: a,
    label: t(`audit.action_${a}`) || a,
  }))

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t('audit.title')}
        subtitle={total > 0 ? `${total} ${t('audit.totalResults')}` : t('audit.clearNote')}
      />

      <Card className="mt-5">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                {t('audit.filterEntity')}
              </label>
              <FilterSelect
                value={filterEntity || ''}
                onChange={(v) => { setFilterEntity(v); setPage(0) }}
                options={entityOptions}
                placeholder={t('common.all')}
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                {t('audit.filterAction')}
              </label>
              <FilterSelect
                value={filterAction || ''}
                onChange={(v) => { setFilterAction(v); setPage(0) }}
                options={actionOptions}
                placeholder={t('common.all')}
              />
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                {t('audit.filterDateFrom')}
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                {t('audit.filterDateTo')}
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                {t('audit.filterUser')}
              </label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => { setFilterSearch(e.target.value); setPage(0) }}
                placeholder={t('common.search') + '...'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={14} />
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : error ? (
          <ErrorState title={t('common.error')} message={error.message} onRetry={load} />
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title={t('audit.noResults')} />
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id
            const hasJson = log.old_data || log.new_data
            return (
              <Card key={log.id}>
                <button
                  type="button"
                  onClick={() => hasJson && setExpandedId(isExpanded ? null : log.id)}
                  className="w-full px-4 py-3.5 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ACTION_TONE[log.action] || 'gray'}>
                      {t(`audit.action_${log.action}`) || log.action}
                    </Badge>
                    <span className="text-sm font-medium text-slate-800">
                      {t(`audit.entity_${log.entity_type}`) || String(log.entity_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                    {log.entity_id && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600" dir="ltr">
                        {log.entity_id}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400" dir="ltr">
                      {formatDateTime(log.created_at)}
                    </span>
                    {hasJson && (
                      <span className="ml-1 text-slate-300">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {log.user?.full_name || '—'}
                  </div>
                </button>

                {isExpanded && hasJson && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{t('audit.oldData')}</p>
                        <PrettyJson data={log.old_data} />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{t('audit.newData')}</p>
                        <PrettyJson data={log.new_data} />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {t('common.previous')}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
