import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
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
}

function entityLabel(entityType) {
  return String(entityType || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

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

export default function AuditLogs() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAuditLogs({ limit: 200 })
      setLogs(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title={t('audit.title')} subtitle={t('audit.clearNote')} />

      <div className="mt-5 space-y-3">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : error ? (
          <ErrorState title={t('common.error')} message={error.message} onRetry={load} />
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title={t('audit.noResults')} />
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <div className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={ACTION_TONE[log.action] || 'gray'}>
                    {t(`audit.action_${log.action}`) || log.action}
                  </Badge>
                  <span className="text-sm font-medium text-slate-800">
                    {t(`audit.entity_${log.entity_type}`) || entityLabel(log.entity_type)}
                  </span>
                  {log.entity_id && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600" dir="ltr">
                      {log.entity_id}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-400" dir="ltr">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  {log.user?.full_name || '—'}
                </div>
                {(log.old_data || log.new_data) && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{t('audit.oldData')}</p>
                      <PrettyJson data={log.old_data} />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">{t('audit.newData')}</p>
                      <PrettyJson data={log.new_data} />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
