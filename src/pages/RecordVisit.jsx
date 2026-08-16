import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import VisitForm from '../components/visits/VisitForm'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { uploadVisitPhotos } from '../services/storage'

export default function RecordVisit() {
  const { customerId } = useParams()
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [refrigerators, setRefrigerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const busyRef = useRef(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [custResult, fridgeResult] = await Promise.all([
          supabase
            .from('customers')
            .select('id, name, phone, commune, wilaya, latitude, longitude')
            .eq('id', customerId)
            .single(),
          supabase
            .from('refrigerators')
            .select('id, serial_number, model, status')
            .eq('customer_id', customerId)
            .neq('status', 'removed')
            .order('serial_number'),
        ])
        if (custResult.error) throw new Error(custResult.error.message)
        setCustomer(custResult.data)
        setRefrigerators(fridgeResult.data || [])
      } catch (err) {
        setError(err)
        navigate('/visits')
        return
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [customerId, navigate])

  const handleSubmit = async (payload) => {
    if (busyRef.current) return
    busyRef.current = true
    setSaving(true)
    try {
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          customer_id: customerId,
          visited_at: new Date().toISOString(),
          refrigerator_condition: payload.refrigerator_condition,
          cleanliness: payload.cleanliness,
          notes: payload.notes,
          latitude: payload.position.latitude,
          longitude: payload.position.longitude,
          refrigerator_id: payload.refrigerator_id || null,
        })
        .select()
        .single()
      if (visitError) throw new Error(visitError.message)

      if (payload.photos.length > 0) {
        await uploadVisitPhotos(visit.id, payload.photos)
      }

      if (payload.locationWarning) toast.info(t('visits.locationFailed'))
      toast.success(t('visits.saved'))
      navigate(`/customers/${customerId}`)
    } catch (err) {
      toast.error(t('visits.saveFailed'))
      console.error('Visit save failed:', err)
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <Spinner label={t('common.loadingData')} />
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <ErrorState title={t('common.error')} message={error.message} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      <h1 className="text-xl font-bold text-slate-900">
        {t('visits.recordFor')} {customer?.name}
      </h1>
      {customer && (
        <p className="mt-0.5 text-sm text-slate-500">
          {[customer.phone, customer.commune, customer.wilaya].filter(Boolean).join(' · ')}
        </p>
      )}

      <Card className="mt-4 p-5">
        <VisitForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          saving={saving}
          refrigerators={refrigerators}
        />
      </Card>

      {saving && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          <CheckCircle2 className="h-4 w-4 animate-pulse" />
          {t('visits.uploading')}
        </div>
      )}
    </div>
  )
}
