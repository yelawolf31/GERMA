import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Refrigerator as RefrigeratorIcon, Pencil, Trash2 } from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import RefrigeratorStatusSelect from '../components/refrigerators/RefrigeratorStatusSelect'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { supabase } from '../lib/supabase'
import { formatDate } from '../utils/format'
import { getRefrigeratorStatusKey } from '../utils/statusLabels'
import { useToast } from '../hooks/useToast'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value || '—'}</span>
    </div>
  )
}

export default function RefrigeratorDetails() {
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

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data: refrig, error } = await supabase
      .from('refrigerators')
      .select('*, customer:customers(id, name, phone, commune, wilaya, latitude, longitude)')
      .eq('id', id)
      .single()
    if (error) {
      setError(error)
      setLoading(false)
      return
    }
    setData(refrig)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStatusChange = async (status) => {
    try {
      const { error } = await supabase.from('refrigerators').update({ status }).eq('id', id)
      if (error) throw new Error(error.message)
      toast.success(t('refrigerators.statusUpdated'))
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('refrigerators').delete().eq('id', id)
      if (error) throw new Error(error.message)
      toast.success(t('refrigerators.deleted'))
      navigate('/refrigerators')
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

  const directionsUrl =
    data.customer?.latitude != null && data.customer?.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${data.customer.latitude},${data.customer.longitude}`
      : null

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <RefrigeratorIcon className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{data.serial_number || t('common.unknown')}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{data.model || ''}</p>
            <div className="mt-1.5">
              <StatusBadge type="refrigerator" value={data.status} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/refrigerators/edit/${data.id}`)}>
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

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader title={t('refrigerators.changeStatus')} />
          <CardBody>
            <RefrigeratorStatusSelect currentStatus={data.status} onChange={handleStatusChange} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('refrigerators.details')} />
          <CardBody className="divide-y divide-slate-100">
            <InfoRow label={t('refrigerators.customer')} value={data.customer?.name} />
            <InfoRow label={t('customers.phone')} value={data.customer?.phone} />
            <InfoRow label={t('customers.location')} value={[data.customer?.commune, data.customer?.wilaya].filter(Boolean).join(', ')} />
            <InfoRow label={t('refrigerators.serialNumber')} value={data.serial_number} />
            <InfoRow label={t('refrigerators.model')} value={data.model} />
            <InfoRow label={t('refrigerators.installationDate')} value={formatDate(data.installation_date)} />
            <InfoRow label={t('refrigerators.status')} value={t(getRefrigeratorStatusKey(data.status))} />
            {data.notes && <InfoRow label={t('refrigerators.notes')} value={data.notes} />}
          </CardBody>
        </Card>

        {data.customer && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/customers/${data.customer.id}`)}>
              {t('customers.open')}
            </Button>
            {directionsUrl && (
              <Button variant="secondary" onClick={() => window.open(directionsUrl, '_blank', 'noopener')}>
                {t('map.directions')}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title={t('refrigerators.delete')}
        message={t('refrigerators.deleteConfirm')}
        confirmLabel={t('refrigerators.delete')}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
