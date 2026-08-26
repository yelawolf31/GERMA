import { useState } from 'react'
import Button from '../ui/Button'
import { Field, Textarea, Select } from '../ui/Field'
import { useTranslation } from '../../i18n'
import { required } from '../../utils/validators'

export default function WarningForm({ visits, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ reason: '', visit_id: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!required(form.reason)) errs.reason = t('common.required')
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await onSubmit({ reason: form.reason, visit_id: form.visit_id || null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={t('warnings.reason')} required error={errors.reason}>
        <Textarea
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          error={errors.reason}
          placeholder={t('warnings.reasonPlaceholder')}
        />
      </Field>
      {visits && visits.length > 0 && (
        <Field label={t('nav.visits')}>
          <Select value={form.visit_id} onChange={(e) => setForm({ ...form, visit_id: e.target.value })}>
            <option value="">—</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.visited_at ? new Date(v.visited_at).toLocaleDateString('fr-DZ') : v.id.slice(0, 8)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
