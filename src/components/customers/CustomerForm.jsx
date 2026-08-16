import { useState } from 'react'
import { MapPin, LocateFixed, Loader2, X } from 'lucide-react'
import Button from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import Modal from '../ui/Modal'
import MapView from '../map/MapView'
import { useTranslation } from '../../i18n'
import { validateCustomer } from '../../utils/validators'
import { WILAYAS } from '../../constants/wilayas'
import { BUSINESS_TYPES } from '../../constants/businessTypes'
import { CUSTOMER_STATUSES } from '../../constants/statuses'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useToast } from '../../hooks/useToast'

const INITIAL_VALUES = {
  name: '',
  business_type: '',
  phone: '',
  address: '',
  wilaya: '',
  commune: '',
  latitude: '',
  longitude: '',
  status: CUSTOMER_STATUSES.ACTIVE,
  notes: '',
}

export default function CustomerForm({ initialValues, onSubmit, onCancel, submitLabel }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { getCurrentPosition, loading: locating } = useGeolocation()

  const [form, setForm] = useState({ ...INITIAL_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const setLocation = (latitude, longitude) => {
    setForm((prev) => ({ ...prev, latitude, longitude }))
  }

  const handleUseCurrentLocation = async () => {
    const position = await getCurrentPosition()
    if (position) {
      setLocation(position.latitude, position.longitude)
    } else {
      toast.error(t('customers.locationError'))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateCustomer(form, t)
    setErrors(validation.errors)
    if (!validation.valid) return
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('customers.name')} required error={errors.name}>
          <Input
            id="customer-name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={errors.name}
            placeholder={t('customers.name') + '...'}
          />
        </Field>

        <Field label={t('customers.businessType')}>
          <Select value={form.business_type} onChange={(e) => setField('business_type', e.target.value)}>
            <option value="">—</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`businessType.${type}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('customers.phone')}>
          <Input
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="0550 00 00 00"
            inputMode="tel"
          />
        </Field>

        <Field label={t('customers.wilaya')} required error={errors.wilaya}>
          <Select value={form.wilaya} onChange={(e) => setField('wilaya', e.target.value)} error={errors.wilaya}>
            <option value="">—</option>
            {WILAYAS.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.name}>
                {wilaya.code} — {wilaya.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('customers.commune')} required error={errors.commune}>
          <Input
            value={form.commune}
            onChange={(e) => setField('commune', e.target.value)}
            error={errors.commune}
            placeholder={t('customers.commune') + '...'}
          />
        </Field>

        <Field label={t('customers.status')}>
          <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
            <option value={CUSTOMER_STATUSES.ACTIVE}>{t('customers.active')}</option>
            <option value={CUSTOMER_STATUSES.INACTIVE}>{t('customers.inactive')}</option>
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label={t('customers.address')}>
            <Input value={form.address} onChange={(e) => setField('address', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="sm:col-span-2">
        <Field label={t('customers.location')}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={handleUseCurrentLocation} disabled={locating}>
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                {t('customers.useCurrentLocation')}
              </Button>
              <Button variant="secondary" size="sm" type="button" onClick={() => setPickerOpen(true)}>
                <MapPin className="h-4 w-4" />
                {t('customers.pickOnMap')}
              </Button>
            </div>

            {form.latitude !== '' && form.longitude !== '' ? (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-slate-600" dir="ltr">
                  {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => setLocation('', '')}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t('customers.locationRequired')}</p>
            )}
          </div>
        </Field>
      </div>

      <Field label={t('customers.notes')}>
        <Textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          {submitLabel || t('common.save')}
        </Button>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={t('customers.chooseLocation')} size="lg">
        <div className="h-80 overflow-hidden rounded-xl">
          <MapView
            locationPicker
            pickedLocation={
              form.latitude !== '' && form.longitude !== ''
                ? { lng: Number(form.longitude), lat: Number(form.latitude) }
                : null
            }
            onPickLocation={(location) => setLocation(location.lat, location.lng)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={() => setPickerOpen(false)}
            disabled={form.latitude === '' || form.longitude === ''}
          >
            {t('customers.confirmLocation')}
          </Button>
        </div>
      </Modal>
    </form>
  )
}
