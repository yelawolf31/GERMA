import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import IssueForm from '../components/issues/IssueForm'
import { Select } from '../components/ui/Field'
import { useIssues } from '../hooks/useIssues'
import { useRefrigerators } from '../hooks/useRefrigerators'
import { useCustomers } from '../hooks/useCustomers'
import { useTranslation } from '../i18n'
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/issues'
import { formatDate } from '../utils/format'
import { createIssue } from '../services/issues'
import { useToast } from '../hooks/useToast'

const PRIORITY_TONE = { low: 'blue', medium: 'yellow', high: 'orange', critical: 'red' }

export default function Issues() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { issues, loading, error, refresh } = useIssues()
  const { customers } = useCustomers()
  const { refrigerators } = useRefrigerators()

  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    const customerParam = searchParams.get('customer')
    if (customerParam) setFormOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let result = issues
    if (statusFilter) result = result.filter((issue) => issue.status === statusFilter)
    if (priorityFilter) result = result.filter((issue) => issue.priority === priorityFilter)
    return result
  }, [issues, statusFilter, priorityFilter])

  const handleCreate = async (payload) => {
    try {
      await createIssue(payload)
      toast.success(t('issues.saved'))
      setFormOpen(false)
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t('issues.title')}
        subtitle={`${issues.filter((i) => i.status === 'open').length} ${t('issues.open').toLowerCase()}`}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('issues.add')}
          </Button>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:w-96">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t('issues.filterByStatus')}</option>
          {Object.values(ISSUE_STATUSES).map((status) => (
            <option key={status} value={status}>
              {t(`issues.${status}`)}
            </option>
          ))}
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">{t('issues.filterByPriority')}</option>
          {Object.values(ISSUE_PRIORITIES).map((priority) => (
            <option key={priority} value={priority}>
              {t(`issues.${priority}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : error ? (
          <ErrorState title={t('common.error')} message={error.message} onRetry={refresh} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title={t('issues.noResults')} />
        ) : (
          filtered.map((issue) => (
            <Card key={issue.id} className="transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${issue.customer_id}`)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                      issue.priority === 'critical' ? 'bg-red-600' : issue.priority === 'high' ? 'bg-orange-500' : 'bg-slate-400'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{issue.customer?.name || '—'}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span>{t(`issues.${issue.issue_type}`)}</span>
                      {issue.refrigerator?.serial_number && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
                          {issue.refrigerator.serial_number}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t('issues.reportedAt')} {formatDate(issue.created_at)} · {issue.reporter?.full_name || '—'}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={PRIORITY_TONE[issue.priority] || 'gray'}>{t(`issues.${issue.priority}`)}</Badge>
                  <StatusBadge type="issueStatus" value={issue.status} />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t('issues.add')}>
        <IssueForm
          initialValues={{ customer_id: searchParams.get('customer') || '' }}
          customers={customers}
          refrigerators={refrigerators}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
          submitLabel={t('issues.add')}
        />
      </Modal>
    </div>
  )
}
