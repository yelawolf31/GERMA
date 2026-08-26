import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Field, Input, Select } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { fetchUserProfiles, createUserByAdmin } from '../services/users'
import { ROLES } from '../constants/roles'
import { formatDate } from '../utils/format'
import { isEmail, required } from '../utils/validators'

const ROLE_FILTERS = ['all', ROLES.ADMIN, ROLES.SUPERVISOR]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export default function Users() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: ROLES.SUPERVISOR })
  const [formErrors, setFormErrors] = useState({})
  const [creating, setCreating] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 300)
  const [roleFilter, setRoleFilter] = useState('all')

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

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let result = users
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)),
      )
    }
    return result
  }, [users, roleFilter, search])

  const handleCreate = async (event) => {
    event.preventDefault()
    const errors = {}
    if (!required(form.email)) errors.email = t('common.required')
    else if (!isEmail(form.email)) errors.email = t('common.invalidEmail')
    if (!required(form.password) || form.password.length < 8) errors.password = t('common.required')
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
    } finally {
      setCreating(false)
    }
  }

  const roleCounts = useMemo(() => {
    const counts = { all: users.length, [ROLES.ADMIN]: 0, [ROLES.SUPERVISOR]: 0 }
    for (const u of users) {
      if (counts[u.role] !== undefined) counts[u.role]++
    }
    return counts
  }, [users])

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

      {/* SEARCH + ROLE FILTER */}
      <Card className="mt-5">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('users.search')}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1.5">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'all' ? t('users.filterAll') : r === ROLES.ADMIN ? t('users.admin') : t('users.supervisor')}
                <span className="ml-1 text-[10px] opacity-60">{roleCounts[r]}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* USER LIST */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : error ? (
          <ErrorState title={t('common.error')} message={error.message} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('users.noResults')} description={search ? t('common.noData') : undefined} />
        ) : (
          filtered.map((user) => {
            const isMe = user.id === currentUser?.id
            const isAdmin = user.role === ROLES.ADMIN
            return (
              <Card
                key={user.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      isAdmin ? 'bg-purple-500' : 'bg-teal-500'
                    }`}
                  >
                    {getInitials(user.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.full_name}
                      {isMe && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500" dir="ltr">{user.email}</p>
                  </div>
                  <Badge tone={isAdmin ? 'purple' : 'teal'}>
                    {isAdmin ? t('users.admin') : t('users.supervisor')}
                  </Badge>
                  <span className="hidden text-xs text-slate-400 sm:block">{formatDate(user.created_at)}</span>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* CREATE USER MODAL */}
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
