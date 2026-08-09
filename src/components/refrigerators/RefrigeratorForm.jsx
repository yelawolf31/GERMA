import { useState } from 'react'
import Button from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { useTranslation } from '../../i18n'
import { validateRefrigerator } from '../../utils/validators'
import { REFRIGERATOR_STATUSES } from '../../constants/statuses'

const INITIAL_VALUES = {
  customer_id: '',
  serial_number: '',
  model: '',
  installation_date: '',
  status: REFRIGERATOR_STATUSES.WORKING,
  notes: '',
}

export default function RefrigeratorForm({ initialValues, customers, onSubmit, onCancel, submitLabel, disableCustomerSelect = false }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ ...INITIAL_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateRefrigerator(form, t)
    setErrors(validation.errors)
    if (!validation.valid) return
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        installation_date: form.installation_date || null,
        serial_number: form.serial_number || null,
        model: form.model || null,
        notes: form.notes || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label={t('refrigerators.customer')} required error={errors.customer_id}>
            <Select
              value={form.customer_id}
              onChange={(e) => setField('customer_id', e.target.value)}
              disabled={disableCustomerSelect}
              error={errors.customer_id}
            >
              <option value="">—</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t('refrigerators.serialNumber')}>
          <Input
            value={form.serial_number}
            onChange={(e) => setField('serial_number', e.target.value)}
            placeholder="GERMA-0000"
          />
        </Field>

        <Field label={t('refrigerators.model')}>
          <Input value={form.model} onChange={(e) => setField('model', e.target.value)} />
        </Field>

        <Field label={t('refrigerators.installationDate')}>
          <Input
            type="date"
            value={form.installation_date}
            onChange={(e) => setField('installation_date', e.target.value)}
          />
        </Field>

        <Field label={t('refrigerators.status')}>
          <Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
            {Object.values(REFRIGERATOR_STATUSES).map((status) => (
              <option key={status} value={status}>
                {t(`refrigerators.${status}`)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label={t('refrigerators.notes')}>
            <Textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" type="button" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          {submitLabel || t('common.save')}
        </Button>
      </div>
    </form>
  )
}
