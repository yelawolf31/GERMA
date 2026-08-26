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
import { formatDateTime, formatDate } from '../utils/format'

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
  'customer', 'refrigerator', 'visit', 'issue',
  'visit_photo', 'issue_photo', 'customer_photo', 'refrigerator_photo',
  'user', 'profile', 'auth', 'product',
]

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'photo_upload', 'photo_delete', 'LOGIN', 'LOGOUT']

const HIDDEN_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'created_by', 'user_id', 'entity_id',
  'path', 'bucket', 'public_url', 'signed_url', 'latitude', 'longitude',
  'resolved_at', 'image_url',
])

const ENUM_MAP = {
  status: {
    active: 'customers.active', inactive: 'customers.inactive',
    working: 'refrigerators.working', needs_maintenance: 'refrigerators.needs_maintenance',
    broken: 'refrigerators.broken', removed: 'refrigerators.removed',
    open: 'issues.open', in_progress: 'issues.in_progress', resolved: 'issues.resolved',
  },
  cleanliness: { good: 'visits.good', medium: 'visits.medium', bad: 'visits.bad' },
  priority: { low: 'issues.low', medium: 'issues.medium', high: 'issues.high', critical: 'issues.critical' },
  role: { admin: 'users.admin', supervisor: 'users.supervisor' },
  issue_type: {
    cooling_problem: 'issues.cooling_problem', electrical_problem: 'issues.electrical_problem',
    door_problem: 'issues.door_problem', lighting_problem: 'issues.lighting_problem',
    cleanliness_problem: 'issues.cleanliness_problem', other: 'issues.other',
  },
  business_type: {
    superette: 'businessType.superette', epicerie: 'businessType.epicerie',
    boucherie: 'businessType.boucherie', patisserie: 'businessType.patisserie',
    cafe: 'businessType.cafe', restaurant: 'businessType.restaurant',
  },
}

const FIELD_LABELS = {
  status: 'audit.field_status', name: 'audit.field_name', phone: 'audit.field_phone',
  email: 'audit.field_email', description: 'audit.field_description',
  priority: 'audit.field_priority', cleanliness: 'audit.field_cleanliness',
  condition: 'audit.field_condition', model: 'audit.field_model',
  serial_number: 'audit.field_serialNumber', notes: 'audit.field_notes',
  wilaya: 'audit.field_wilaya', commune: 'audit.field_commune',
  customer_id: 'audit.field_customerId', role: 'audit.field_role',
  visited_at: 'audit.field_visitedAt', refrigerator_condition: 'audit.field_refrigeratorCondition',
  installation_date: 'audit.field_installationDate', issue_type: 'audit.field_issueType',
  address: 'audit.field_address', business_type: 'audit.field_businessType',
  is_active: 'audit.field_isActive', full_name: 'audit.field_fullName',
  refrigerator_id: 'audit.field_refrigeratorId',
}

const PAGE_SIZE = 15

function parseJson(data) {
  if (!data) return null
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return null } }
  return data
}

function shortUuid(val) {
  if (!val || typeof val !== 'string') return '—'
  return val.length > 8 ? val.slice(0, 8) : val
}

function formatFieldValue(fieldKey, value, t) {
  if (value === null || value === undefined || value === '') return '—'
  if (fieldKey === 'is_active') return value ? t('common.yes') : t('common.no')
  if (fieldKey === 'installation_date' || fieldKey === 'visited_at') {
    const formatted = fieldKey === 'visited_at' ? formatDateTime(value) : formatDate(value)
    return formatted || value
  }
  if (fieldKey === 'customer_id' || fieldKey === 'supervisor_id' || fieldKey === 'refrigerator_id' || fieldKey === 'visit_id' || fieldKey === 'issue_id') {
    return shortUuid(value)
  }
  const enumGroup = ENUM_MAP[fieldKey]
  if (enumGroup && enumGroup[value]) return t(enumGroup[value])
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no')
  return String(value)
}

function DiffView({ oldData, newData, entityType, t }) {
  const oldParsed = parseJson(oldData)
  const newParsed = parseJson(newData)

  if (entityType === 'auth') {
    const data = newParsed || oldParsed
    if (data?.email) return <p className="text-sm text-slate-700">{data.email}</p>
    return null
  }

  if ((entityType === 'visit_photo' || entityType === 'issue_photo' || entityType === 'customer_photo' || entityType === 'refrigerator_photo') && !oldParsed && newParsed) {
    return null
  }
  if ((entityType === 'visit_photo' || entityType === 'issue_photo' || entityType === 'customer_photo' || entityType === 'refrigerator_photo') && oldParsed && !newParsed) {
    return null
  }

  if (oldParsed && newParsed && typeof oldParsed === 'object' && typeof newParsed === 'object') {
    const allKeys = [...new Set([...Object.keys(oldParsed), ...Object.keys(newParsed)])]
    const visibleKeys = allKeys.filter((k) => !HIDDEN_FIELDS.has(k))

    if (visibleKeys.length === 0) return null

    return (
      <div className="space-y-1.5">
        {visibleKeys.map((key) => {
          const oldVal = oldParsed[key]
          const newVal = newParsed[key]
          if (oldVal === newVal) return null
          const label = FIELD_LABELS[key] ? t(FIELD_LABELS[key]) : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          return (
            <div key={key} className="flex items-baseline gap-2 text-sm">
              <span className="shrink-0 font-medium text-slate-500">{label}:</span>
              <span className="text-red-500/70 line-through">{formatFieldValue(key, oldVal, t)}</span>
              <span className="text-slate-400">→</span>
              <span className="font-medium text-emerald-600">{formatFieldValue(key, newVal, t)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const data = newParsed || oldParsed
  if (data && typeof data === 'object') {
    const visibleKeys = Object.keys(data).filter((k) => !HIDDEN_FIELDS.has(k))
    if (visibleKeys.length === 0) return null
    return (
      <div className="space-y-1.5">
        {visibleKeys.map((key) => {
          const label = FIELD_LABELS[key] ? t(FIELD_LABELS[key]) : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          return (
            <div key={key} className="flex items-baseline gap-2 text-sm">
              <span className="shrink-0 font-medium text-slate-500">{label}:</span>
              <span className="text-slate-700">{formatFieldValue(key, data[key], t)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return null
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
        limit: PAGE_SIZE, offset: page * PAGE_SIZE,
        entityType: filterEntity, action: filterAction,
        dateFrom: filterDateFrom || null, dateTo: filterDateTo || null,
        search: filterSearch || null,
      }
      const result = await fetchAuditLogs(params)
      setLogs(result.logs)
      setTotal(result.total)
    } catch (err) { setError(err) } finally { setLoading(false) }
  }, [page, filterEntity, filterAction, filterDateFrom, filterDateTo, filterSearch])

  useEffect(() => { load() }, [load])

  const resetFilters = () => {
    setFilterEntity(null); setFilterAction(null)
    setFilterDateFrom(''); setFilterDateTo(''); setFilterSearchInput(''); setPage(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = filterEntity || filterAction || filterDateFrom || filterDateTo || filterSearchInput

  const entityOptions = useMemo(() => ENTITY_TYPES.map((e) => ({
    value: e, label: t(`audit.entity_${e}`) || e.replace(/_/g, ' '),
  })), [t])

  const actionOptions = useMemo(() => ACTIONS.map((a) => ({
    value: a, label: t(`audit.action_${a}`) || a,
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
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">{t('audit.filterEntity')}</label>
              <select value={filterEntity || ''} onChange={(e) => { setFilterEntity(e.target.value || null); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">{t('common.all')}</option>
                {entityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">{t('audit.filterAction')}</label>
              <select value={filterAction || ''} onChange={(e) => { setFilterAction(e.target.value || null); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">{t('common.all')}</option>
                {actionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">{t('audit.filterDateFrom')}</label>
              <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">{t('audit.filterDateTo')}</label>
              <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(0) }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1 block text-[11px] font-medium uppercase text-slate-400">{t('audit.filterUser')}</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" value={filterSearchInput} onChange={(e) => { setFilterSearchInput(e.target.value); setPage(0) }}
                  placeholder={t('common.search') + '...'}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <RotateCcw size={14} />{t('common.reset')}
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
                      <span className="max-w-[200px] truncate text-xs text-slate-500" title={entityName}>{entityName}</span>
                    )}
                    <span className="ml-auto text-xs text-slate-400" dir="ltr">{formatDateTime(log.created_at)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                    <User size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate">{log.user?.full_name || '—'}</span>
                  </div>
                  {hasJson && (
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? t('audit.hideDetails') : t('audit.viewDetails')}
                    </button>
                  )}
                </div>
                {isExpanded && hasJson && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <DiffView oldData={log.old_data} newData={log.new_data} entityType={log.entity_type} t={t} />
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">{page + 1} / {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              {t('common.previous')}
            </button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
