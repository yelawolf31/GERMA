import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, User, Calendar, Building2, Phone } from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import StatusBadge from '../components/ui/StatusBadge'
import { useTranslation } from '../i18n'
import { fetchVisitById } from '../services/visits'
import { formatDate, formatTime } from '../utils/format'

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm text-slate-800">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function VisitDetails() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [visit, setVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVisitById(visitId)
        if (!cancelled) setVisit(data)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [visitId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label={t('common.loadingData')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState title={t('common.error')} message={error.message} onRetry={() => navigate('/visits')} />
      </div>
    )
  }

  if (!visit) return null

  const directionsUrl =
    visit.customer?.latitude != null && visit.customer?.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${visit.customer.latitude},${visit.customer.longitude}`
      : null

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="secondary" size="icon" onClick={() => navigate('/visits')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-slate-800">{t('visits.details')}</h1>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title={t('visits.visitInfo')} />
          <CardBody className="divide-y divide-slate-100">
            <InfoRow
              label={t('visits.visitedAt')}
              value={
                <span dir="ltr">
                  {formatDate(visit.visited_at)} {formatTime(visit.visited_at)}
                </span>
              }
              icon={Calendar}
            />
            <InfoRow
              label={t('visits.supervisor')}
              value={visit.supervisor?.full_name}
              icon={User}
            />
            <InfoRow
              label={t('visits.condition')}
              value={<StatusBadge type="condition" value={visit.refrigerator_condition} />}
            />
            <InfoRow
              label={t('visits.cleanliness')}
              value={<StatusBadge type="cleanliness" value={visit.cleanliness} />}
            />
            {visit.notes && <InfoRow label={t('refrigerators.notes')} value={visit.notes} />}
            {(visit.latitude != null || visit.longitude != null) && (
              <InfoRow
                label={t('map.coordinates')}
                value={
                  <span dir="ltr">
                    {visit.latitude?.toFixed(5)}, {visit.longitude?.toFixed(5)}
                  </span>
                }
                icon={MapPin}
              />
            )}
          </CardBody>
        </Card>

        {visit.customer && (
          <Card>
            <CardHeader title={t('visits.customer')} />
            <CardBody className="divide-y divide-slate-100">
              <InfoRow label={t('customers.name')} value={visit.customer.name} icon={User} />
              <InfoRow label={t('customers.phone')} value={visit.customer.phone} icon={Phone} />
              <InfoRow
                label={t('customers.location')}
                value={[visit.customer.commune, visit.customer.wilaya].filter(Boolean).join(', ')}
                icon={Building2}
              />
            </CardBody>
          </Card>
        )}

        {visit.customer && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/customers/${visit.customer.id}`)}>
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
    </div>
  )
}
