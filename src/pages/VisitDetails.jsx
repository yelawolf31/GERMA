import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, MapPin, User, Calendar, Building2, Phone, Refrigerator as FridgeIcon,
  Clock, ShieldAlert,
} from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import PhotoGallery from '../components/visits/PhotoGallery'
import { useTranslation } from '../i18n'
import { useAuth } from '../hooks/useAuth'
import { fetchVisitById } from '../services/visits'
import { fetchVisitPhotos } from '../services/storage'
import { formatDate, formatTime } from '../utils/format'
import { getRefrigeratorStatusKey } from '../utils/statusLabels'

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm text-slate-800">{value || '—'}</div>
      </div>
    </div>
  )
}

export default function VisitDetails() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAdmin } = useAuth()
  const [visit, setVisit] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const data = await fetchVisitById(visitId)
        if (cancelled) return
        if (!data) {
          setNotFound(true)
        } else {
          setVisit(data)
        }
      } catch (err) {
        if (!cancelled) {
          if (err.message?.includes('not found') || err.message?.includes('No rows')) {
            setNotFound(true)
          } else {
            setError(err)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [visitId])

  useEffect(() => {
    if (!visit) return
    let cancelled = false
    const loadPhotos = async () => {
      setPhotosLoading(true)
      try {
        const data = await fetchVisitPhotos(visit.id)
        if (!cancelled) setPhotos(data)
      } catch {
        // non-blocking
      } finally {
        if (!cancelled) setPhotosLoading(false)
      }
    }
    loadPhotos()
    return () => { cancelled = true }
  }, [visit])

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

  if (notFound) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState title={t('visits.notFound')} description={t('visits.notFoundDesc')} />
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/visits')}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  if (!visit) return null

  const isAuthorized = isAdmin || visit.supervisor_id === user?.id
  if (!isAuthorized) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ShieldAlert className="h-12 w-12 text-red-400" />
          <h2 className="text-lg font-semibold text-slate-800">{t('visits.permissionDenied')}</h2>
          <p className="text-sm text-slate-500">{t('visits.permissionDeniedDesc')}</p>
          <Button variant="secondary" className="mt-2" onClick={() => navigate('/visits')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  const directionsUrl =
    visit.customer?.latitude != null && visit.customer?.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${visit.customer.latitude},${visit.customer.longitude}`
      : null

  const refrigerator = visit.refrigerator
  const customer = visit.customer
  const supervisor = visit.supervisor

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
              value={
                <span>
                  {supervisor?.full_name || '—'}
                  {isAdmin && supervisor?.email && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({supervisor.email} · {supervisor.role || 'supervisor'})
                    </span>
                  )}
                </span>
              }
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
            {visit.notes && <InfoRow label={t('visits.notes')} value={visit.notes} />}
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
            <InfoRow
              label={t('visits.createdAt')}
              value={
                <span dir="ltr" className="text-xs text-slate-400">
                  {formatDate(visit.created_at)} {formatTime(visit.created_at)}
                </span>
              }
              icon={Clock}
            />
          </CardBody>
        </Card>

        {customer && (
          <Card>
            <CardHeader title={t('visits.customer')} />
            <CardBody className="divide-y divide-slate-100">
              <InfoRow label={t('customers.name')} value={customer.name} icon={User} />
              <InfoRow label={t('customers.phone')} value={customer.phone} icon={Phone} />
              {customer.address && <InfoRow label={t('customers.address')} value={customer.address} icon={Building2} />}
              <InfoRow
                label={t('customers.location')}
                value={[customer.commune, customer.wilaya].filter(Boolean).join(', ')}
                icon={Building2}
              />
              {(customer.latitude != null || customer.longitude != null) && (
                <InfoRow
                  label={t('map.coordinates')}
                  value={
                    <span dir="ltr">
                      {customer.latitude?.toFixed(5)}, {customer.longitude?.toFixed(5)}
                    </span>
                  }
                  icon={MapPin}
                />
              )}
            </CardBody>
          </Card>
        )}

        {refrigerator ? (
          <Card>
            <CardHeader title={t('refrigerators.details')} />
            <CardBody className="divide-y divide-slate-100">
              <InfoRow label={t('refrigerators.serialNumber')} value={refrigerator.serial_number} icon={FridgeIcon} />
              <InfoRow label={t('refrigerators.model')} value={refrigerator.model} />
              <InfoRow
                label={t('refrigerators.status')}
                value={<StatusBadge type="refrigerator" value={refrigerator.status} />}
              />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="flex items-center gap-3 py-2 text-sm text-slate-500">
                <FridgeIcon className="h-4 w-4 shrink-0 text-slate-300" />
                {t('visits.noRefrigerator')}
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title={t('visits.photos')} />
          <CardBody>
            <PhotoGallery photos={photos} loading={photosLoading} />
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-2">
          {customer && (
            <Button variant="secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
              {t('visits.viewCustomer')}
            </Button>
          )}
          {refrigerator && (
            <Button variant="secondary" onClick={() => navigate(`/refrigerators/${refrigerator.id}`)}>
              {t('visits.viewRefrigerator')}
            </Button>
          )}
          {directionsUrl && (
            <Button variant="secondary" onClick={() => window.open(directionsUrl, '_blank', 'noopener')}>
              {t('map.directions')}
            </Button>
          )}
          {customer && (
            <Button onClick={() => navigate(`/visits/record/${customer.id}`)}>
              {t('visits.record')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
