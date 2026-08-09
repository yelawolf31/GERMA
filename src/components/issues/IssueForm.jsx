import { useState } from 'react'
import Button from '../ui/Button'
import { Field, Select, Textarea } from '../ui/Field'
import { useTranslation } from '../../i18n'
import { validateIssue } from '../../utils/validators'
import { ISSUE_TYPES, ISSUE_PRIORITIES } from '../../constants/issues'

const INITIAL_VALUES = {
  customer_id: '',
  refrigerator_id: '',
  issue_type: '',
  priority: '',
  description: '',
}

export default function IssueForm({ initialValues, customers, refrigerators, onSubmit, onCancel, submitLabel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ ...INITIAL_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const customerRefrigerators = refrigerators.filter((ref) => ref.customer_id === form.customer_id)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateIssue(form, t)
    setErrors(validation.errors)
    if (!validation.valid) return
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        refrigerator_id: form.refrigerator_id || null,
        description: form.description || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('issues.customer')} required error={errors.customer_id}>
          <Select
            value={form.customer_id}
            onChange={(e) => {
              setField('customer_id', e.target.value)
              setField('refrigerator_id', '')
            }}
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

        <Field label={t('issues.refrigerator')}>
          <Select
            value={form.refrigerator_id}
            onChange={(e) => setField('refrigerator_id', e.target.value)}
            disabled={!form.customer_id}
          >
            <option value="">—</option>
            {customerRefrigerators.map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.serial_number || ref.model || '—'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('issues.issueType')} required error={errors.issue_type}>
          <Select value={form.issue_type} onChange={(e) => setField('issue_type', e.target.value)} error={errors.issue_type}>
            <option value="">—</option>
            {Object.values(ISSUE_TYPES).map((type) => (
              <option key={type} value={type}>
                {t(`issues.${type}`)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('issues.priority')} required error={errors.priority}>
          <Select value={form.priority} onChange={(e) => setField('priority', e.target.value)} error={errors.priority}>
            <option value="">—</option>
            {Object.values(ISSUE_PRIORITIES).map((priority) => (
              <option key={priority} value={priority}>
                {t(`issues.${priority}`)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label={t('issues.description')} required error={errors.description}>
            <Textarea rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} error={errors.description} />
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
