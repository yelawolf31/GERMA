import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Field, Textarea } from '../components/ui/Field'
import VisitForm from '../components/visits/VisitForm'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { uploadVisitPhotos } from '../services/storage'
import { createWarning } from '../services/warnings'
import { required } from '../utils/validators'

export default function RecordVisit() {
  const { customerId } = useParams()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [refrigerators, setRefrigerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const busyRef = useRef(false)

  const [savedVisitId, setSavedVisitId] = useState(null)
  const [warningOpen, setWarningOpen] = useState(false)
  const [warningReason, setWarningReason] = useState('')
  const [warningReasonError, setWarningReasonError] = useState('')
  const [warningSaving, setWarningSaving] = useState(false)

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
      setSavedVisitId(visit.id)
      setWarningOpen(true)
    } catch (err) {
      toast.error(t('visits.saveFailed'))
      console.error('Visit save failed:', err)
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  const handleSkipWarning = () => {
    navigate(`/customers/${customerId}`)
  }

  const handleSaveWarning = async () => {
    if (!required(warningReason)) {
      setWarningReasonError(t('common.required'))
      return
    }
    setWarningSaving(true)
    try {
      await createWarning({
        customer_id: customerId,
        visit_id: savedVisitId,
        reason: warningReason,
        issued_by: profile.id,
      })
      toast.success(t('warnings.saved'))
      navigate(`/customers/${customerId}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWarningSaving(false)
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

      <Modal open={warningOpen} onClose={handleSkipWarning} title={t('warnings.visitWarning')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{t('warnings.visitWarningReason')}</p>
          <Field label={t('warnings.reason')} required error={warningReasonError}>
            <Textarea
              rows={3}
              value={warningReason}
              onChange={(e) => { setWarningReason(e.target.value); setWarningReasonError('') }}
              error={warningReasonError}
              placeholder={t('warnings.reasonPlaceholder')}
            />
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={handleSkipWarning} disabled={warningSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveWarning} loading={warningSaving} disabled={warningSaving}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
