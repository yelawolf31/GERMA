import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Store,
  Refrigerator,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  ScrollText,
  LogOut,
  Snowflake,
  MoreHorizontal,
  Wifi,
  WifiOff,
} from 'lucide-react'
import BottomSheet from '../components/ui/BottomSheet'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n'
import { ROLES } from '../constants/roles'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/map', icon: Map, key: 'nav.map', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/customers', icon: Store, key: 'nav.customers', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/refrigerators', icon: Refrigerator, key: 'nav.refrigerators', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/visits', icon: ClipboardList, key: 'nav.visits', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/issues', icon: AlertTriangle, key: 'nav.issues', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/reports', icon: BarChart3, key: 'nav.reports', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/settings', icon: Settings, key: 'nav.settings', roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: '/users', icon: Users, key: 'nav.users', roles: [ROLES.ADMIN] },
  { to: '/audit-logs', icon: ScrollText, key: 'nav.auditLogs', roles: [ROLES.ADMIN] },
]

const MOBILE_PRIMARY = ['/dashboard', '/map', '/customers', '/visits']

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700">
        <Snowflake className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight text-slate-900">Germa</p>
        <p className="text-xs leading-tight text-slate-500">Field Management</p>
      </div>
    </div>
  )
}

function NavLinkItem({ item, onClick }) {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {t(item.key)}
    </NavLink>
  )
}

function MobileNavItem({ item, onClick }) {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
          isActive ? 'text-brand-700' : 'text-slate-500'
        }`
      }
    >
      <Icon className="h-5 w-5" />
      {t(item.key)}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { role, isAdmin, profile, signOut } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useState(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  })

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const desktopItems = visibleItems
  const mobileMoreItems = visibleItems.filter((item) => !MOBILE_PRIMARY.includes(item.to))

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {desktopItems.map((item) => (
            <NavLinkItem key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{profile?.full_name || '—'}</p>
              <p className="text-xs capitalize text-slate-500">{isAdmin ? t('users.admin') : t('users.supervisor')}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
              aria-label={t('nav.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Brand />
          <div className="flex items-center gap-2">
            {!online && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                <WifiOff className="h-3 w-3" />
              </span>
            )}
            {online && <Wifi className="h-4 w-4 text-slate-300" />}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
              {initials}
            </div>
          </div>
        </header>

        {!online && (
          <div className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800 lg:hidden">
            {t('app.offline')}
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="safe-bottom grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
          {MOBILE_PRIMARY.map((to) => {
            const item = visibleItems.find((i) => i.to === to)
            if (!item) return null
            return <MobileNavItem key={to} item={item} />
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-slate-500"
          >
            <MoreHorizontal className="h-5 w-5" />
            {t('nav.more')}
          </button>
        </nav>
      </div>

      {/* "More" sheet on mobile */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={t('nav.more')}>
        <div className="space-y-1">
          {mobileMoreItems.map((item) => (
            <NavLinkItem key={item.to} item={item} onClick={() => setMoreOpen(false)} />
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
