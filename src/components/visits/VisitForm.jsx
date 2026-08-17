import { useRef, useState } from 'react'
import { Camera, Upload, ImagePlus, MapPin, Loader2, X, AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import { Field, Textarea, Select } from '../ui/Field'
import { useTranslation } from '../../i18n'
import { validateVisit } from '../../utils/validators'
import { REFRIGERATOR_CONDITIONS, CLEANLINESS_LEVELS } from '../../constants/statuses'
import { useGeolocation } from '../../hooks/useGeolocation'
import { compressImage } from '../../utils/image'

const CONDITION_OPTIONS = [
  { value: REFRIGERATOR_CONDITIONS.WORKING, dot: 'bg-emerald-500', labelKey: 'refrigerators.working' },
  { value: REFRIGERATOR_CONDITIONS.NEEDS_MAINTENANCE, dot: 'bg-orange-500', labelKey: 'refrigerators.needsMaintenance' },
  { value: REFRIGERATOR_CONDITIONS.BROKEN, dot: 'bg-red-500', labelKey: 'refrigerators.broken' },
]

const CLEANLINESS_OPTIONS = [
  { value: CLEANLINESS_LEVELS.GOOD, dot: 'bg-emerald-500', labelKey: 'visits.good' },
  { value: CLEANLINESS_LEVELS.MEDIUM, dot: 'bg-amber-500', labelKey: 'visits.medium' },
  { value: CLEANLINESS_LEVELS.BAD, dot: 'bg-red-500', labelKey: 'visits.bad' },
]

function OptionGrid({ options, value, onChange, t }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'border-brand-600 bg-brand-50 text-brand-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`h-3 w-3 rounded-full ${option.dot}`} />
            {t(option.labelKey)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Visit form: condition, cleanliness, notes, photos.
 * Collects data + files; the parent performs DB and storage writes.
 */
export default function VisitForm({ onSubmit, onCancel, saving, refrigerators = [] }) {
  const { t } = useTranslation()
  const { getCurrentPosition, position, error: geoError, loading: locating } = useGeolocation()
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [form, setForm] = useState({ refrigerator_condition: '', cleanliness: '', notes: '', refrigerator_id: '' })
  const [errors, setErrors] = useState({})
  const [photos, setPhotos] = useState([])
  const [compressing, setCompressing] = useState(false)

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const handleLocation = async () => {
    await getCurrentPosition()
  }

  const addFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    setCompressing(true)
    try {
      const files = Array.from(fileList)
      const compressed = []
      for (const file of files) {
        const next = await compressImage(file)
        compressed.push({ file: next, preview: URL.createObjectURL(next) })
      }
      setPhotos((prev) => [...prev, ...compressed].slice(0, 6))
    } finally {
      setCompressing(false)
    }
  }

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const next = [...prev]
      if (next[index]?.preview) URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateVisit(form, t)
    setErrors(validation.errors)
    if (!validation.valid) return

    await onSubmit({
      refrigerator_condition: form.refrigerator_condition,
      cleanliness: form.cleanliness,
      notes: form.notes || null,
      refrigerator_id: form.refrigerator_id || null,
      photos: photos.map((p) => p.file),
      position: position
        ? { latitude: position.latitude, longitude: position.longitude }
        : { latitude: null, longitude: null },
      locationWarning: !position,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={t('visits.location')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={handleLocation} disabled={locating}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {t('visits.getLocation')}
            </Button>
            {position && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('visits.locationCaptured')}
                {position.accuracy != null && position.accuracy > 500 ? (
                  <span className="ml-1 flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    {t('visits.locationLowAccuracy')}
                  </span>
                ) : null}
              </span>
            )}
          </div>
          {geoError && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('visits.locationFailed')}
            </p>
          )}
        </div>
      </Field>

      {refrigerators.length > 0 && (
        <Field label={t('visits.linkedRefrigerator')}>
          <Select value={form.refrigerator_id} onChange={(e) => setField('refrigerator_id', e.target.value)}>
            <option value="">{t('visits.noRefrigerator')}</option>
            {refrigerators.map((r) => (
              <option key={r.id} value={r.id}>
                {r.serial_number} — {r.model || r.status}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label={t('visits.condition')} required error={errors.refrigerator_condition}>
        <OptionGrid
          options={CONDITION_OPTIONS}
          value={form.refrigerator_condition}
          onChange={(value) => setField('refrigerator_condition', value)}
          t={t}
        />
      </Field>

      <Field label={t('visits.cleanliness')} required error={errors.cleanliness}>
        <OptionGrid
          options={CLEANLINESS_OPTIONS}
          value={form.cleanliness}
          onChange={(value) => setField('cleanliness', value)}
          t={t}
        />
      </Field>

      <Field label={t('visits.notes')}>
        <Textarea rows={3} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
      </Field>

      <Field label={t('visits.photos')}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={compressing}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {t('visits.takePhoto')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={compressing}
              onClick={() => galleryInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {t('visits.uploadPhoto')}
            </Button>
            {compressing && <span className="self-center text-xs text-slate-500">{t('visits.uploading')}</span>}
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                  <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-red-600"
                    aria-label={t('common.delete')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={saving} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {t('visits.complete')}
        </Button>
      </div>
    </form>
  )
}
