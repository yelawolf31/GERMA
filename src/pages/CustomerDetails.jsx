import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Store,
  Navigation,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  Refrigerator as RefrigeratorIcon,
  AlertTriangle,
} from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import MapView from '../components/map/MapView'
import RefrigeratorStatusSelect from '../components/refrigerators/RefrigeratorStatusSelect'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { supabase } from '../lib/supabase'
import { getCustomerMarkerStatus, getMarkerColor } from '../utils/markerStatus'
import { formatDate, formatTime } from '../utils/format'
import { useToast } from '../hooks/useToast'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value || '—'}</span>
    </div>
  )
}

export default function CustomerDetails() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [customerResult, refrigResult, visitResult, issueResult] = await Promise.all([
        supabase.from('customers').select('*, created_by:profiles(full_name)').eq('id', id).single(),
        supabase.from('refrigerators').select('*').eq('customer_id', id).order('created_at'),
        supabase.from('visits').select('*, supervisor:profiles(full_name)').eq('customer_id', id).order('visited_at', { ascending: false }),
        supabase.from('issues').select('*, reporter:profiles(full_name)').eq('customer_id', id).order('created_at', { ascending: false }),
      ])
      if (customerResult.error) throw new Error(customerResult.error.message)
      if (refrigResult.error) throw new Error(refrigResult.error.message)
      if (visitResult.error) throw new Error(visitResult.error.message)
      if (issueResult.error) throw new Error(issueResult.error.message)

      const refrigerators = refrigResult.data || []
      const customer = customerResult.data
      const markerStatus = getCustomerMarkerStatus(customer, refrigerators)
      setData({
        customer: { ...customer, markerStatus, markerColor: getMarkerColor(markerStatus) },
        refrigerators,
        visits: visitResult.data || [],
        issues: issueResult.data || [],
      })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw new Error(error.message)
      toast.success(t('customers.deleted'))
      navigate('/customers')
    } catch (err) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <Spinner label={t('common.loadingData')} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState title={t('common.error')} message={error?.message} onRetry={load} />
      </div>
    )
  }

  const { customer, refrigerators, visits, issues } = data

  const directionsUrl =
    customer.latitude != null && customer.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`
      : null

  return (
    <div className="p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: customer.markerColor }}
          >
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {[customer.business_type && t(`businessType.${customer.business_type}`), customer.commune, customer.wilaya]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="mt-1.5">
              <Badge tone={customer.status === 'active' ? 'green' : 'gray'}>
                {customer.status === 'active' ? t('customers.active') : t('customers.inactive')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/visits/record/${customer.id}`)}>
            <ClipboardList className="h-4 w-4" />
            {t('customers.recordVisit')}
          </Button>
          {directionsUrl && (
            <Button variant="secondary" size="sm" onClick={() => window.open(directionsUrl, '_blank', 'noopener')}>
              <Navigation className="h-4 w-4" />
              {t('map.directions')}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/issues/add?customer=${customer.id}`)}>
            <AlertTriangle className="h-4 w-4" />
            {t('issues.add')}
          </Button>
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/customers/edit/${customer.id}`)}>
                <Pencil className="h-4 w-4" />
                {t('customers.edit')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                {t('customers.delete')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader title={t('customers.details')} />
            <CardBody className="divide-y divide-slate-100">
              <InfoRow label={t('customers.phone')} value={customer.phone} />
              <InfoRow label={t('customers.address')} value={customer.address} />
              <InfoRow label={t('customers.wilaya')} value={customer.wilaya} />
              <InfoRow label={t('customers.commune')} value={customer.commune} />
              <InfoRow label={t('customers.createdBy')} value={customer.created_by?.full_name} />
              <InfoRow
                label={t('customers.location')}
                value={customer.latitude != null ? `${customer.latitude.toFixed(5)}, ${customer.longitude.toFixed(5)}` : '—'}
              />
              {customer.notes && <InfoRow label={t('customers.notes')} value={customer.notes} />}
            </CardBody>
          </Card>

          {customer.latitude != null && customer.longitude != null && (
            <Card>
              <CardHeader title={t('customers.location')} />
              <div className="h-56 overflow-hidden rounded-b-2xl">
                <MapView
                  customers={[{ ...customer, markerStatus: customer.markerStatus, markerColor: customer.markerColor }]}
                  selectedCustomerId={customer.id}
                />
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title={t('customers.refrigerators')}
              subtitle={`${refrigerators.length} ${t('customers.refrigerators').toLowerCase()}`}
              action={
                <Button size="sm" onClick={() => navigate(`/refrigerators/add?customer=${customer.id}`)}>
                  <Plus className="h-4 w-4" />
                  {t('customers.addRefrigerator')}
                </Button>
              }
            />
            {refrigerators.length === 0 ? (
              <CardBody>
                <EmptyState title={t('customers.noRefrigerators')} />
              </CardBody>
            ) : (
              <div className="divide-y divide-slate-100">
                {refrigerators.map((refrigerator) => (
                  <div key={refrigerator.id} className="px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {refrigerator.serial_number || refrigerator.model || '—'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {refrigerator.model && <span>{refrigerator.model}</span>}
                          {refrigerator.installation_date && (
                            <span>
                              {t('refrigerators.installationDate')} : {formatDate(refrigerator.installation_date)}
                            </span>
                          )}
                          <StatusBadge type="refrigerator" value={refrigerator.status} />
                        </div>
                        {refrigerator.notes && <p className="mt-1 text-xs text-slate-500">{refrigerator.notes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isAdmin && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/refrigerators/edit/${refrigerator.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <RefrigeratorIcon className="h-4 w-4 text-slate-300" />
                          </>
                        )}
                        <Link to={`/refrigerators/${refrigerator.id}`}>
                          <Button variant="secondary" size="sm">
                            {t('common.view')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="mt-3">
                      <RefrigeratorStatusSelect
                        currentStatus={refrigerator.status}
                        onChange={async (status) => {
                          try {
                            const { error } = await supabase.from('refrigerators').update({ status }).eq('id', refrigerator.id)
                            if (error) throw new Error(error.message)
                            await load()
                          } catch (err) {
                            toast.error(err.message)
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title={t('customers.visitHistory')} subtitle={`${visits.length} ${t('nav.visits')}`} />
            {visits.length === 0 ? (
              <CardBody>
                <EmptyState title={t('customers.noVisits')} />
              </CardBody>
            ) : (
              <div className="divide-y divide-slate-100">
                {visits.map((visit) => (
                  <div key={visit.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800" dir="ltr">
                        {formatDate(visit.visited_at)} {formatTime(visit.visited_at)}
                      </p>
                      <p className="text-xs text-slate-500">{visit.supervisor?.full_name || '—'}</p>
                    </div>
                    <StatusBadge type="condition" value={visit.refrigerator_condition} />
                    <StatusBadge type="cleanliness" value={visit.cleanliness} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title={t('customers.issues')} subtitle={`${issues.length} ${t('customers.issues').toLowerCase()}`} />
            {issues.length === 0 ? (
              <CardBody>
                <EmptyState title={t('customers.noIssues')} />
              </CardBody>
            ) : (
              <div className="divide-y divide-slate-100">
                {issues.map((issue) => (
                  <div key={issue.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{t(`issues.${issue.issue_type}`)}</p>
                      <p className="text-xs text-slate-500">
                        {t('issues.reportedAt')} {formatDate(issue.created_at)} · {issue.reporter?.full_name || '—'}
                      </p>
                    </div>
                    <StatusBadge type="priority" value={issue.priority} />
                    <StatusBadge type="issueStatus" value={issue.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={t('customers.delete')}
        message={t('customers.deleteConfirm')}
        confirmLabel={t('customers.delete')}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
