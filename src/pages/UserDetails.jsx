import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, KeyRound } from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Field, Input, Select } from '../components/ui/Field'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { fetchUserProfile, updateUserByAdmin, deleteUserByAdmin, resetUserPassword } from '../services/users'
import { ROLES } from '../constants/roles'
import { supabase } from '../lib/supabase'
import { formatDate, formatDateTime } from '../utils/format'
import { required } from '../utils/validators'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value || '—'}</span>
    </div>
  )
}

export default function UserDetails() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [visitsCount, setVisitsCount] = useState(0)
  const [issuesCount, setIssuesCount] = useState(0)
  const [lastVisitDate, setLastVisitDate] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', role: ROLES.SUPERVISOR })
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetErrors, setResetErrors] = useState({})
  const [resetting, setResetting] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileResult, visitsResult, issuesResult, lastVisitResult] = await Promise.all([
        fetchUserProfile(id),
        supabase.from('visits').select('id', { count: 'exact', head: true }).eq('supervisor_id', id),
        supabase.from('issues').select('id', { count: 'exact', head: true }).eq('reported_by', id),
        supabase.from('visits').select('visited_at').eq('supervisor_id', id).order('visited_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      setUser(profileResult)
      setVisitsCount(visitsResult.count || 0)
      setIssuesCount(issuesResult.count || 0)
      setLastVisitDate(lastVisitResult.data?.visited_at || null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleEdit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!required(editForm.full_name)) errors.full_name = t('common.required')
    setEditErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      await updateUserByAdmin(id, editForm)
      toast.success(t('users.profileUpdated'))
      setEditOpen(false)
      load()
    } catch (err) {
      toast.error(t('users.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!resetPassword || resetPassword.length < 8) errors.password = t('common.required')
    setResetErrors(errors)
    if (Object.keys(errors).length > 0) return

    setResetting(true)
    try {
      await resetUserPassword(id, resetPassword)
      toast.success(t('users.passwordReset'))
      setResetOpen(false)
      setResetPassword('')
    } catch (err) {
      toast.error(t('users.passwordResetFailed'))
    } finally {
      setResetting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUserByAdmin(id)
      toast.success(t('users.userDeleted'))
      navigate('/users')
    } catch (err) {
      toast.error(t('users.deleteFailed'))
      setDeleting(false)
    }
  }

  const openEditModal = () => {
    setEditForm({ full_name: user.full_name || '', role: user.role })
    setEditErrors({})
    setEditOpen(true)
  }

  const openResetModal = () => {
    setResetPassword('')
    setResetErrors({})
    setResetOpen(true)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <Spinner label={t('common.loadingData')} />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState title={t('common.error')} message={error?.message} onRetry={load} />
      </div>
    )
  }

  const isAdmin = user.role === ROLES.ADMIN

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${
              isAdmin ? 'bg-purple-500' : 'bg-teal-500'
            }`}
          >
            {getInitials(user.full_name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.full_name}</h1>
            <p className="mt-0.5 text-sm text-slate-500" dir="ltr">{user.email}</p>
            <div className="mt-1.5">
              <Badge tone={isAdmin ? 'purple' : 'teal'}>
                {isAdmin ? t('users.admin') : t('users.supervisor')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={openEditModal}>
            <Pencil className="h-4 w-4" /> {t('common.edit')}
          </Button>
          <Button variant="secondary" size="sm" onClick={openResetModal}>
            <KeyRound className="h-4 w-4" /> {t('users.resetPassword')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* CARDS */}
      <div className="mt-6 space-y-6">
        {/* INFO */}
        <Card>
          <CardHeader title={t('users.details')} />
          <CardBody className="divide-y divide-slate-100">
            <InfoRow label={t('users.email')} value={user.email} />
            <InfoRow label={t('users.role')} value={isAdmin ? t('users.admin') : t('users.supervisor')} />
            <InfoRow label={t('users.createdAt')} value={formatDate(user.created_at)} />
          </CardBody>
        </Card>

        {/* ACTIVITY */}
        <Card>
          <CardHeader title={t('nav.activity') || 'Activité'} />
          <CardBody className="divide-y divide-slate-100">
            <InfoRow
              label={t('nav.visits')}
              value={visitsCount > 0 ? t('users.visitsCount').replace('{count}', visitsCount) : '0'}
            />
            <InfoRow
              label={t('nav.issues')}
              value={issuesCount > 0 ? t('users.issuesCount').replace('{count}', issuesCount) : '0'}
            />
            <InfoRow
              label={t('users.lastVisit')}
              value={lastVisitDate ? formatDateTime(lastVisitDate) : t('users.noVisits')}
            />
          </CardBody>
        </Card>
      </div>

      {/* EDIT MODAL */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('users.edit')}>
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label={t('users.fullName')} required error={editErrors.full_name}>
            <Input
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              error={editErrors.full_name}
            />
          </Field>
          <Field label={t('users.role')} required>
            <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value={ROLES.ADMIN}>{t('users.admin')}</option>
              <option value={ROLES.SUPERVISOR}>{t('users.supervisor')}</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" type="button" onClick={() => setEditOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={t('users.resetPassword')}>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-600">{t('users.resetPasswordConfirm')}</p>
          <Field label={t('users.newPassword')} required error={resetErrors.password}>
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              error={resetErrors.password}
              placeholder="••••••••"
            />
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" type="button" onClick={() => setResetOpen(false)} disabled={resetting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={resetting} disabled={resetting}>
              {t('common.confirm')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={deleteOpen}
        title={t('users.delete')}
        message={t('users.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
