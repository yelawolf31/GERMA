import { useCallback, useEffect, useState } from 'react'
import { UserPlus, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Field, Input, Select } from '../components/ui/Field'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { fetchUserProfiles, createUserByAdmin } from '../services/users'
import { ROLES } from '../constants/roles'
import { formatDate } from '../utils/format'
import { isEmail, required } from '../utils/validators'

export default function Users() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: ROLES.SUPERVISOR })
  const [formErrors, setFormErrors] = useState({})
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserProfiles()
      setUsers(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (event) => {
    event.preventDefault()
    const errors = {}
    if (!required(form.email)) errors.email = t('common.required')
    else if (!isEmail(form.email)) errors.email = t('common.invalidEmail')
    if (!required(form.password) || form.password.length < 6) errors.password = t('common.required')
    if (!required(form.full_name)) errors.full_name = t('common.required')
    if (!required(form.role)) errors.role = t('common.required')
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setCreating(true)
    try {
      await createUserByAdmin(form)
      toast.success(t('users.saved'))
      setFormOpen(false)
      setForm({ email: '', password: '', full_name: '', role: ROLES.SUPERVISOR })
      load()
    } catch (err) {
      toast.error(t('users.saveFailed'))
      console.error('create-user:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.note')}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t('users.add')}
          </Button>
        }
      />

      <div className="mt-5 space-y-3">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : users.length === 0 ? (
          <EmptyState title={t('users.noResults')} />
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <ShieldCheck className="h-5 w-5 text-brand-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500" dir="ltr">
                    {user.email}
                  </p>
                </div>
                <Badge tone={user.role === ROLES.ADMIN ? 'purple' : 'teal'}>
                  {user.role === ROLES.ADMIN ? t('users.admin') : t('users.supervisor')}
                </Badge>
                <span className="hidden text-xs text-slate-400 sm:block">{formatDate(user.created_at)}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t('users.add')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label={t('users.fullName')} required error={formErrors.full_name}>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} error={formErrors.full_name} />
          </Field>
          <Field label={t('users.email')} required error={formErrors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} />
          </Field>
          <Field label={t('users.password')} required error={formErrors.password}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={formErrors.password} />
          </Field>
          <Field label={t('users.role')} required error={formErrors.role}>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value={ROLES.ADMIN}>{t('users.admin')}</option>
              <option value={ROLES.SUPERVISOR}>{t('users.supervisor')}</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={creating} disabled={creating}>
              {t('users.add')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
