import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '../components/ui/Button'
import { useTranslation } from '../i18n'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <Compass className="h-12 w-12 text-slate-300" />
      <h1 className="text-3xl font-bold text-slate-900">404</h1>
      <p className="text-sm text-slate-500">{t('common.error')}</p>
      <Link to="/dashboard">
        <Button>{t('nav.dashboard')}</Button>
      </Link>
    </div>
  )
}
