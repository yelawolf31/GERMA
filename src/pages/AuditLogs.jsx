import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollText, ChevronDown, ChevronUp, RotateCcw, Search, User } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'
import { useTranslation } from '../i18n'
import { useDebounce } from '../hooks/useDebounce'
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

const FIELD_LABELS = {
  status: 'audit.field_status',
  name: 'audit.field_name',
  phone: 'audit.field_phone',
  email: 'audit.field_email',
  description: 'audit.field_description',
  priority: 'audit.field_priority',
  cleanliness: 'audit.field_cleanliness',
  condition: 'audit.field_condition',
  model: 'audit.field_model',
  serial_number: 'audit.field_serialNumber',
  notes: 'audit.field_notes',
  wilaya: 'audit.field_wilaya',
  commune: 'audit.field_commune',
  customer_id: 'audit.field_customerId',
  role: 'audit.field_role',
}

const PAGE_SIZE = 15

function parseJson(data) {
  if (!data) return null
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return null }
  }
  return data
}

function RawJson({ data }) {
  const parsed = parseJson(data)
  if (!parsed) return <span className="text-slate-400">—</span>
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
      {JSON.stringify(parsed, null, 1)}
    </pre>
  )
}

function DiffView({ oldData, newData, t }) {
  const oldParsed = parseJson(oldData)
  const newParsed = parseJson(newData)

  if (oldParsed && newParsed && typeof oldParsed === 'object' && typeof newParsed === 'object') {
    const allKeys = [...new Set([...Object.keys(oldParsed), ...Object.keys(newParsed)])]
    if (allKeys.length > 0) {
      return (
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-3 py-1.5 font-medium text-slate-500">{t('audit.entityType')}</th>
                {oldParsed && <th className="px-3 py-1.5 font-medium text-slate-500">{t('audit.oldData')}</th>}
                <th className="px-3 py-1.5 font-medium text-slate-500">{t('audit.newData')}</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map((key) => {
                const oldVal = oldParsed?.[key]
                const newVal = newParsed?.[key]
                if (oldVal === newVal) return null
                if (oldVal === undefined && newVal === undefined) return null
                const label = FIELD_LABELS[key] ? t(FIELD_LABELS[key]) : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                return (
                  <tr key={key} className="border-b border-slate-50 last:border-0">
                    <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-600">{label}</td>
                    {oldParsed && (
                      <td className="px-3 py-1.5 text-red-600/70">
                        {oldVal !== undefined ? String(oldVal) : '—'}
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-emerald-600">
                      {newVal !== undefined ? String(newVal) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }
  }

  if (oldParsed || newParsed) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {oldParsed && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{t('audit.oldData')}</p>
            <RawJson data={oldParsed} />
          </div>
        )}
        {newParsed && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{t('audit.newData')}</p>
            <RawJson data={newParsed} />
          </div>
        )}
      </div>
    )
  }

  return <RawJson data={newData || oldData} />
}

function extractEntityName(log) {
  const data = parseJson(log.new_data) || parseJson(log.old_data)
  if (data && typeof data === 'object') {
    if (data.name) return data.name
    if (data.email) return data.email
    if (data.serial_number) return data.serial_number
  }
  return null
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
  const [filterSearchInput, setFilterSearchInput] = useState('')
  const filterSearch = useDebounce(filterSearchInput, 300)

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
  }, [page, filterEntity, filterAction, filterDateFrom, filterDateTo, filterSearch])

  useEffect(() => {
    load()
  }, [load])

  const resetFilters = () => {
    setFilterEntity(null)
    setFilterAction(null)
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterSearchInput('')
    setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = filterEntity || filterAction || filterDateFrom || filterDateTo || filterSearchInput

  const entityOptions = useMemo(() => ENTITY_TYPES.map((e) => ({
    value: e,
    label: t(`audit.entity_${e}`) || e.replace(/_/g, ' '),
  })), [t])

  const actionOptions = useMemo(() => ACTIONS.map((a) => ({
    value: a,
    label: t(`audit.action_${a}`) || a,
  })), [t])

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
              <select
                value={filterEntity || ''}
                onChange={(e) => { setFilterEntity(e.target.value || null); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('common.all')}</option>
                {entityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">
                {t('audit.filterAction')}
              </label>
              <select
                value={filterAction || ''}
                onChange={(e) => { setFilterAction(e.target.value || null); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('common.all')}</option>
                {actionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterSearchInput}
                  onChange={(e) => { setFilterSearchInput(e.target.value); setPage(0) }}
                  placeholder={t('common.search') + '...'}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
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
            const entityName = extractEntityName(log)
            return (
              <Card key={log.id}>
                <div className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ACTION_TONE[log.action] || 'gray'}>
                      {t(`audit.action_${log.action}`) || log.action}
                    </Badge>
                    <span className="text-sm font-medium text-slate-800">
                      {t(`audit.entity_${log.entity_type}`) || String(log.entity_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                    {entityName && (
                      <span className="max-w-[200px] truncate text-xs text-slate-500" title={entityName}>
                        {entityName}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400" dir="ltr">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                    <User size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate">{log.user?.full_name || '—'}</span>
                  </div>

                  {hasJson && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? t('audit.hideDetails') : t('audit.viewDetails')}
                    </button>
                  )}
                </div>

                {isExpanded && hasJson && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <DiffView oldData={log.old_data} newData={log.new_data} t={t} />
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
