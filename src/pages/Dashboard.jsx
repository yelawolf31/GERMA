import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import DataTable from '../components/ui/DataTable'
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

function NameCell({ primary, secondary }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-slate-800">{primary}</p>
      {secondary && <p className="truncate text-xs text-slate-500">{secondary}</p>}
    </div>
  )
}

function DateCell({ value, showTime = false }) {
  if (!value) return <span className="text-slate-400">—</span>
  return (
    <span className="whitespace-nowrap text-xs text-slate-500" dir="ltr">
      {formatDate(value)}
      {showTime && ` ${formatTime(value)}`}
    </span>
  )
}

function CountCell({ value, danger }) {
  if (!value) return <span className="text-slate-400">{value}</span>
  return <span className={`font-semibold ${danger ? 'text-red-600' : 'text-slate-700'}`}>{value}</span>
}

function AdminDashboard({ customers, visits, issues }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

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

  const visitRows = useMemo(
    () =>
      visits.map((v) => ({
        id: v.id,
        customerName: v.customer?.name || '—',
        location: [v.customer?.commune, v.customer?.wilaya].filter(Boolean).join(', '),
        supervisor: v.supervisor?.full_name || '—',
        condition: v.refrigerator_condition,
        cleanliness: v.cleanliness,
        visitedAt: v.visited_at,
      })),
    [visits],
  )

  const issueRows = useMemo(
    () =>
      issues.map((i) => ({
        id: i.id,
        customerId: i.customer_id,
        customerName: i.customer?.name || '—',
        issueType: i.issue_type,
        priority: i.priority,
        status: i.status,
        createdAt: i.created_at,
      })),
    [issues],
  )

  const customerRows = useMemo(
    () =>
      customers.map((c) => ({
        id: c.id,
        name: c.name,
        location: [c.commune, c.wilaya].filter(Boolean).join(' · '),
        businessType: c.business_type,
        refrigerators: c.refrigerators.length,
        lastVisitAt: c.lastVisitAt,
        openIssues: c.openIssueCount || 0,
        status: c.status,
      })),
    [customers],
  )

  const refrigeratorRows = useMemo(
    () =>
      customers.flatMap((c) =>
        c.refrigerators.map((r) => ({
          id: r.id,
          serialNumber: r.serial_number,
          model: r.model,
          customerName: c.name,
          status: r.status,
        })),
      ),
    [customers],
  )

  const visitColumns = useMemo(
    () => [
      {
        key: 'customerName',
        label: t('dashboard.tableCustomer'),
        sortable: true,
        render: (value, row) => <NameCell primary={value} secondary={row.location} />,
      },
      {
        key: 'supervisor',
        label: t('dashboard.tableSupervisor'),
        sortable: true,
        render: (value) => <span className="text-slate-600">{value}</span>,
      },
      {
        key: 'condition',
        label: t('dashboard.tableCondition'),
        align: 'center',
        render: (value) => <StatusBadge type="condition" value={value} />,
      },
      {
        key: 'cleanliness',
        label: t('dashboard.tableCleanliness'),
        align: 'center',
        render: (value) => <StatusBadge type="cleanliness" value={value} />,
      },
      {
        key: 'visitedAt',
        label: t('dashboard.date'),
        sortable: true,
        align: 'right',
        render: (value) => <DateCell value={value} />,
      },
    ],
    [t],
  )

  const issueColumns = useMemo(
    () => [
      {
        key: 'customerName',
        label: t('dashboard.tableCustomer'),
        sortable: true,
        render: (value) => <NameCell primary={value} />,
      },
      {
        key: 'issueType',
        label: t('dashboard.tableIssueType'),
        sortable: true,
        render: (value) => <span className="text-slate-600">{t(`issues.${value}`)}</span>,
      },
      {
        key: 'priority',
        label: t('dashboard.tablePriority'),
        align: 'center',
        render: (value) => <StatusBadge type="priority" value={value} />,
      },
      {
        key: 'status',
        label: t('dashboard.tableStatus'),
        align: 'center',
        render: (value) => <StatusBadge type="issueStatus" value={value} />,
      },
      {
        key: 'createdAt',
        label: t('dashboard.date'),
        sortable: true,
        align: 'right',
        render: (value) => <DateCell value={value} />,
      },
    ],
    [t],
  )

  const customerColumns = useMemo(
    () => [
      {
        key: 'name',
        label: t('dashboard.tableCustomer'),
        sortable: true,
        render: (value, row) => <NameCell primary={value} secondary={row.location} />,
      },
      {
        key: 'businessType',
        label: t('dashboard.tableActivity'),
        sortable: true,
        render: (value) => (value ? <span className="text-slate-600">{t(`businessType.${value}`)}</span> : '—'),
      },
      {
        key: 'refrigerators',
        label: t('customers.refrigerators'),
        sortable: true,
        align: 'center',
        render: (value) => <CountCell value={value} />,
      },
      {
        key: 'lastVisitAt',
        label: t('customers.lastVisit'),
        sortable: true,
        align: 'right',
        render: (value) => {
          if (!value) return <span className="text-slate-400">—</span>
          const stale = new Date(value) < startOfDaysAgo(7)
          return (
            <span className={`whitespace-nowrap text-xs ${stale ? 'font-medium text-red-600' : 'text-slate-500'}`} dir="ltr">
              {formatDate(value)}
            </span>
          )
        },
      },
      {
        key: 'openIssues',
        label: t('dashboard.openIssues'),
        sortable: true,
        align: 'center',
        render: (value) => <CountCell value={value} danger={value > 0} />,
      },
      {
        key: 'status',
        label: t('dashboard.tableStatus'),
        align: 'center',
        render: (value) => <StatusBadge type="customer" value={value} />,
      },
    ],
    [t],
  )

  const refrigeratorColumns = useMemo(
    () => [
      {
        key: 'serialNumber',
        label: t('refrigerators.serialNumber'),
        sortable: true,
        render: (value) => <span className="font-medium text-slate-800" dir="ltr">{value}</span>,
      },
      {
        key: 'model',
        label: t('refrigerators.model'),
        sortable: true,
        render: (value) => <span className="text-slate-600">{value || '—'}</span>,
      },
      {
        key: 'customerName',
        label: t('dashboard.tableCustomer'),
        sortable: true,
        render: (value) => <NameCell primary={value} />,
      },
      {
        key: 'status',
        label: t('dashboard.tableStatus'),
        align: 'center',
        render: (value) => <StatusBadge type="refrigerator" value={value} />,
      },
    ],
    [t],
  )

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
          <DataTable
            columns={visitColumns}
            rows={visitRows.slice(0, 8)}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/visits/${row.id}`)}
            emptyState={<EmptyState title={t('dashboard.noVisits')} />}
            initialSort="visitedAt"
          />
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
          <DataTable
            columns={issueColumns}
            rows={issueRows.slice(0, 8)}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/customers/${row.customerId}`)}
            emptyState={<EmptyState title={t('dashboard.noIssues')} />}
            initialSort="createdAt"
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t('dashboard.customersOverview')}
            action={
              <Link to="/customers" className="text-xs font-medium text-brand-700 hover:underline">
                {t('dashboard.seeAll')}
              </Link>
            }
          />
          <DataTable
            columns={customerColumns}
            rows={customerRows.slice(0, 8)}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
            emptyState={<EmptyState title={t('dashboard.noCustomers')} />}
            initialSort="name"
            initialDir="asc"
          />
        </Card>

        <Card>
          <CardHeader
            title={t('dashboard.refrigeratorsStatus')}
            action={
              <Link to="/refrigerators" className="text-xs font-medium text-brand-700 hover:underline">
                {t('dashboard.seeAll')}
              </Link>
            }
          />
          <DataTable
            columns={refrigeratorColumns}
            rows={refrigeratorRows.slice(0, 8)}
            getRowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/refrigerators/${row.id}`)}
            emptyState={<EmptyState title={t('dashboard.noRefrigerators')} />}
            initialSort="serialNumber"
            initialDir="asc"
          />
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
  const navigate = useNavigate()
  const { position, loading: locating, getCurrentPosition } = useGeolocation()

  const todayVisits = visits.filter((v) => isToday(v.visited_at))
  const myOpenIssues = issues.filter((i) => (i.status === 'open' || i.status === 'in_progress'))
  const brokenRefrigerators = customers.flatMap((c) => c.refrigerators).filter((r) => r.status === REFRIGERATOR_STATUSES.BROKEN)
  const notVisitedRecently = customers.filter((c) => {
    if (!c.lastVisitAt) return true
    return new Date(c.lastVisitAt) < startOfDaysAgo(7)
  })

  const visitRows = useMemo(
    () =>
      visits.map((v) => ({
        id: v.id,
        customerName: v.customer?.name || '—',
        supervisor: v.supervisor?.full_name || '—',
        condition: v.refrigerator_condition,
        cleanliness: v.cleanliness,
        visitedAt: v.visited_at,
      })),
    [visits],
  )

  const visitColumns = useMemo(
    () => [
      {
        key: 'customerName',
        label: t('dashboard.tableCustomer'),
        sortable: true,
        render: (value) => <NameCell primary={value} />,
      },
      {
        key: 'condition',
        label: t('dashboard.tableCondition'),
        align: 'center',
        render: (value) => <StatusBadge type="condition" value={value} />,
      },
      {
        key: 'cleanliness',
        label: t('dashboard.tableCleanliness'),
        align: 'center',
        render: (value) => <StatusBadge type="cleanliness" value={value} />,
      },
      {
        key: 'visitedAt',
        label: t('dashboard.date'),
        sortable: true,
        align: 'right',
        render: (value) => <DateCell value={value} showTime />,
      },
    ],
    [t],
  )

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

      <Card>
        <CardHeader title={t('dashboard.recentVisits')} />
        <DataTable
          columns={visitColumns}
          rows={visitRows.slice(0, 8)}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/visits/${row.id}`)}
          emptyState={<EmptyState title={t('dashboard.noVisits')} />}
          initialSort="visitedAt"
        />
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