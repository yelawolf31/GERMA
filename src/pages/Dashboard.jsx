import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  Refrigerator,
  CheckCircle2,
  Wrench,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Navigation,
  ArrowRight,
  LocateFixed,
} from 'lucide-react'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useMapData } from '../hooks/useMapData'
import { useVisits } from '../hooks/useVisits'
import { useIssues } from '../hooks/useIssues'
import { useTranslation } from '../i18n'
import { ROLES } from '../constants/roles'
import { REFRIGERATOR_STATUSES } from '../constants/statuses'
import { formatDate, formatTime, isToday, startOfDaysAgo } from '../utils/format'
import { sortCustomersByDistance, formatDistance } from '../utils/geo'
import { useGeolocation } from '../hooks/useGeolocation'

function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    sky: 'bg-sky-50 text-sky-700',
  }
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
          <p className="truncate text-xs text-slate-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function AdminDashboard({ customers, visits, issues }) {
  const { t } = useTranslation()

  const stats = useMemo(() => {
    const allRefrigerators = customers.flatMap((c) => c.refrigerators)
    return {
      customers: customers.length,
      refrigerators: allRefrigerators.length,
      working: allRefrigerators.filter((r) => r.status === REFRIGERATOR_STATUSES.WORKING).length,
      needsMaintenance: allRefrigerators.filter((r) => r.status === REFRIGERATOR_STATUSES.NEEDS_MAINTENANCE).length,
      broken: allRefrigerators.filter((r) => r.status === REFRIGERATOR_STATUSES.BROKEN).length,
      openIssues: issues.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
      todayVisits: visits.filter((v) => isToday(v.visited_at)).length,
    }
  }, [customers, visits, issues])

  const recentVisits = visits.slice(0, 6)
  const recentIssues = issues.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard icon={Store} label={t('dashboard.totalCustomers')} value={stats.customers} />
        <StatCard icon={Refrigerator} label={t('dashboard.totalRefrigerators')} value={stats.refrigerators} tone="sky" />
        <StatCard icon={CheckCircle2} label={t('dashboard.working')} value={stats.working} tone="green" />
        <StatCard icon={Wrench} label={t('dashboard.needsMaintenance')} value={stats.needsMaintenance} tone="orange" />
        <StatCard icon={XCircle} label={t('dashboard.broken')} value={stats.broken} tone="red" />
        <StatCard icon={AlertTriangle} label={t('dashboard.openIssues')} value={stats.openIssues} tone="orange" />
        <StatCard icon={ClipboardList} label={t('dashboard.todayVisits')} value={stats.todayVisits} tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t('dashboard.recentVisits')}
            action={
              <Link to="/visits" className="text-xs font-medium text-brand-700 hover:underline">
                {t('dashboard.seeAll')}
              </Link>
            }
          />
          {recentVisits.length === 0 ? (
            <CardBody>
              <EmptyState title={t('dashboard.noVisits')} />
            </CardBody>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {visit.customer?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500">{visit.supervisor?.full_name || '—'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge type="condition" value={visit.refrigerator_condition} />
                    <StatusBadge type="cleanliness" value={visit.cleanliness} />
                  </div>
                  <span className="shrink-0 text-xs text-slate-400" dir="ltr">
                    {formatDate(visit.visited_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={t('dashboard.recentIssues')}
            action={
              <Link to="/issues" className="text-xs font-medium text-brand-700 hover:underline">
                {t('dashboard.seeAll')}
              </Link>
            }
          />
          {recentIssues.length === 0 ? (
            <CardBody>
              <EmptyState title={t('dashboard.noIssues')} />
            </CardBody>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {issue.customer?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500">{t(`issues.${issue.issue_type}`)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge type="priority" value={issue.priority} />
                    <StatusBadge type="issueStatus" value={issue.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function NearMeList({ customers, position }) {
  const { t } = useTranslation()
  if (!position) {
    return (
      <EmptyState
        icon={LocateFixed}
        title={t('dashboard.noNearbyCustomers')}
        description={t('customers.locationError')}
      />
    )
  }
  const nearby = sortCustomersByDistance(customers, position).slice(0, 6)
  if (nearby.length === 0) {
    return <EmptyState title={t('dashboard.noNearbyCustomers')} />
  }
  return (
    <div className="divide-y divide-slate-100">
      {nearby.map((customer) => (
        <div key={customer.id} className="flex items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{customer.name}</p>
            <p className="text-xs text-slate-500">
              {customer.refrigerators.length} {t('customers.refrigerators')}
              {' · '}
              <span className="font-medium text-brand-700">{formatDistance(customer.distanceKm)}</span>
            </p>
          </div>
          <Link to={`/customers/${customer.id}`}>
            <Button variant="secondary" size="sm">
              {t('customers.open')}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  )
}

function SupervisorDashboard({ customers, visits, issues }) {
  const { t } = useTranslation()
  const { position, loading: locating, getCurrentPosition } = useGeolocation()

  const todayVisits = visits.filter((v) => isToday(v.visited_at))
  const myOpenIssues = issues.filter((i) => (i.status === 'open' || i.status === 'in_progress'))
  const brokenRefrigerators = customers.flatMap((c) => c.refrigerators).filter((r) => r.status === REFRIGERATOR_STATUSES.BROKEN)
  const notVisitedRecently = customers.filter((c) => {
    if (!c.lastVisitAt) return true
    return new Date(c.lastVisitAt) < startOfDaysAgo(7)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={ClipboardList} label={t('dashboard.todayVisits')} value={todayVisits.length} tone="green" />
        <StatCard icon={AlertTriangle} label={t('dashboard.openIssues')} value={myOpenIssues.length} tone="orange" />
        <StatCard icon={XCircle} label={t('dashboard.broken')} value={brokenRefrigerators.length} tone="red" />
        <StatCard icon={Store} label={t('dashboard.notVisitedRecently')} value={notVisitedRecently.length} tone="sky" />
      </div>

      <Card>
        <CardHeader
          title={t('dashboard.customersNearMe')}
          action={
            <Button variant="secondary" size="sm" onClick={getCurrentPosition} loading={locating} disabled={locating}>
              <LocateFixed className="h-4 w-4" />
              {t('map.currentLocation')}
            </Button>
          }
        />
        <NearMeList customers={customers} position={position} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('dashboard.recentVisits')} />
          {visits.slice(0, 6).length === 0 ? (
            <CardBody>
              <EmptyState title={t('dashboard.noVisits')} />
            </CardBody>
          ) : (
            <div className="divide-y divide-slate-100">
              {visits.slice(0, 6).map((visit) => (
                <div key={visit.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{visit.customer?.name || '—'}</p>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {formatDate(visit.visited_at)} {formatTime(visit.visited_at)}
                    </p>
                  </div>
                  <StatusBadge type="condition" value={visit.refrigerator_condition} />
                  <StatusBadge type="cleanliness" value={visit.cleanliness} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title={t('dashboard.notVisitedRecently')} />
          {notVisitedRecently.slice(0, 6).length === 0 ? (
            <CardBody>
              <EmptyState title={t('dashboard.noVisits')} />
            </CardBody>
          ) : (
            <div className="divide-y divide-slate-100">
              {notVisitedRecently.slice(0, 6).map((customer) => (
                <div key={customer.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{customer.name}</p>
                    <p className="text-xs text-slate-500">
                      {t('customers.lastVisit')} : {formatDate(customer.lastVisitAt)}
                    </p>
                  </div>
                  <Link to={`/map?customer=${customer.id}`}>
                    <Button variant="secondary" size="sm">
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { role, isAdmin } = useAuth()
  const { customers, loading, error, refresh } = useMapData()
  const { visits } = useVisits()
  const { issues } = useIssues()

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <Spinner label={t('common.loadingData')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <p className="mb-3 text-sm font-medium text-red-600">{error.message}</p>
        <Button variant="secondary" onClick={refresh}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? t('users.admin') : t('users.supervisor')} — {t('app.name')}
          </p>
        </div>
        {role === ROLES.SUPERVISOR && (
          <Link to="/map" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            {t('nav.map')} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isAdmin ? (
        <AdminDashboard customers={customers} visits={visits} issues={issues} />
      ) : (
        <SupervisorDashboard customers={customers} visits={visits} issues={issues} />
      )}
    </div>
  )
}
