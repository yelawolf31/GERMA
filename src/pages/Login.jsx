import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertTriangle } from 'lucide-react'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { validateLogin } from '../utils/validators'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    const validation = validateLogin(form, t)
    setErrors(validation.errors)
    if (!validation.valid) return

    setLoading(true)
    try {
      await signIn(form.email.trim(), form.password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-semibold">{t('auth.missingConfig')}</p>
          </div>
          <code className="block overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-emerald-400">
            VITE_SUPABASE_URL=
            <br />
            VITE_SUPABASE_ANON_KEY=
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/icons/logo.jpg" alt="Germa" className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-xl font-bold text-slate-900">Germa Field</h1>
          <p className="text-sm text-slate-500">{t('app.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label={t('auth.email')} required error={errors.email}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                error={errors.email}
                className="pl-9"
                placeholder="exemple@germa.dz"
              />
            </div>
          </Field>

          <Field label={t('auth.password')} required error={errors.password}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                error={errors.password}
                className="pl-9"
              />
            </div>
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}

          <Button type="submit" loading={loading} disabled={loading} className="w-full" size="lg">
            {t('auth.signIn')}
          </Button>
        </form>
      </div>
    </div>
  )
}
