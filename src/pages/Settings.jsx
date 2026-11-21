import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Search, Trash2 } from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Field, Input, Select } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { findOrphanPhotoFiles, purgeOrphanPhotoFiles } from '../services/storage'

export default function Settings() {
  const { t } = useTranslation()
  const { profile, isAdmin, updateProfileName, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const { language, changeLanguage } = useTranslation()
  const [orphanFiles, setOrphanFiles] = useState([])
  const [orphanChecked, setOrphanChecked] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const handleSave = async (event) => {
    event.preventDefault()
    if (!fullName.trim()) return
    setSaving(true)
    try {
      await updateProfileName(fullName.trim())
      toast.success(t('settings.profileSaved'))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAnalyzeStorage = async () => {
    setAnalyzing(true)
    try {
      const files = await findOrphanPhotoFiles()
      setOrphanFiles(files)
      setOrphanChecked(true)
      if (files.length === 0) toast.info(t('settings.storageCleanupNone'))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handlePurgeStorage = async () => {
    setCleaning(true)
    try {
      const removed = await purgeOrphanPhotoFiles(orphanFiles)
      toast.success(t('settings.storageCleanupDone', { count: removed }))
      setCleanupOpen(false)
      setOrphanFiles([])
      setOrphanChecked(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{t('settings.title')}</h1>

      <div className="mt-5 space-y-6">
        <Card>
          <CardHeader title={t('settings.profile')} />
          <CardBody>
            <form onSubmit={handleSave} className="space-y-4">
              <Field label={t('settings.fullName')}>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label={t('settings.email')}>
                <Input value={profile?.email || ''} disabled />
              </Field>
              <Field label={t('settings.role')}>
                <Input value={isAdmin ? t('users.admin') : t('users.supervisor')} disabled />
              </Field>
              <Button type="submit" loading={saving} disabled={saving}>
                {t('settings.saveProfile')}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('settings.language')} />
          <CardBody>
            <Select value={language} onChange={(e) => changeLanguage(e.target.value)}>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
          </CardBody>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader title={t('settings.storageCleanup')} />
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-600">{t('settings.storageCleanupHint')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={handleAnalyzeStorage} loading={analyzing} disabled={analyzing}>
                  <Search className="h-4 w-4" />
                  {t('settings.storageAnalyze')}
                </Button>
                {orphanChecked && orphanFiles.length > 0 && (
                  <Button variant="danger" onClick={() => setCleanupOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    {t('settings.storagePurge', { count: orphanFiles.length })}
                  </Button>
                )}
              </div>
              {orphanChecked && (
                <p className="text-xs font-medium text-slate-500">
                  {orphanFiles.length === 0
                    ? t('settings.storageCleanupNone')
                    : t('settings.storageFound', { count: orphanFiles.length })}
                </p>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title={t('settings.about')} />
          <CardBody className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {t('app.name')} — {t('settings.version')} 1.0.0
            </p>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {t('settings.signOut')}
            </Button>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={cleanupOpen}
        title={t('settings.storageCleanup')}
        message={t('settings.storageCleanupConfirm', { count: orphanFiles.length })}
        confirmLabel={t('settings.storagePurge', { count: orphanFiles.length })}
        onCancel={() => setCleanupOpen(false)}
        onConfirm={handlePurgeStorage}
        loading={cleaning}
      />
    </div>
  )
}
