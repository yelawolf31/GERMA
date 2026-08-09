import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { useMapData } from '../hooks/useMapData'
import { useVisits } from '../hooks/useVisits'
import { useIssues } from '../hooks/useIssues'
import { useTranslation } from '../i18n'
import { ISSUE_TYPES, ISSUE_PRIORITIES } from '../constants/issues'
import { startOfDaysAgo, formatShortDay } from '../utils/format'

const COLORS = {
  working: '#16a34a',
  needs_maintenance: '#f97316',
  broken: '#dc2626',
  removed: '#9ca3af',
  low: '#0ea5e9',
  medium: '#eab308',
  high: '#f97316',
  critical: '#dc2626',
}

function ChartCard({ title, children, height = 260 }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <div style={{ height }}>{children}</div>
      </CardBody>
    </Card>
  )
}

export default function Reports() {
  const { t } = useTranslation()
  const { customers, loading: loadingCustomers } = useMapData()
  const { visits, loading: loadingVisits } = useVisits()
  const { issues, loading: loadingIssues } = useIssues()

  const refrigeratorsByStatus = useMemo(() => {
    const all = customers.flatMap((c) => c.refrigerators)
    const counts = { working: 0, needs_maintenance: 0, broken: 0, removed: 0 }
    all.forEach((ref) => {
      if (counts[ref.status] != null) counts[ref.status] += 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      name: t(`refrigerators.${key}`),
      value,
      color: COLORS[key],
    }))
  }, [customers, t])

  const visitsByDay = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const day = startOfDaysAgo(i)
      days.push({ date: day, key: day.toDateString(), count: 0 })
    }
    visits.forEach((visit) => {
      const date = new Date(visit.visited_at)
      if (date < startOfDaysAgo(13)) return
      const found = days.find((d) => d.key === date.toDateString())
      if (found) found.count += 1
    })
    return days.map((d) => ({ name: formatShortDay(d.date), count: d.count }))
  }, [visits])

  const visitsBySupervisor = useMemo(() => {
    const map = {}
    visits.forEach((visit) => {
      const name = visit.supervisor?.full_name || '—'
      map[name] = (map[name] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [visits])

  const issuesByType = useMemo(() => {
    const counts = {}
    Object.values(ISSUE_TYPES).forEach((type) => {
      counts[type] = issues.filter((issue) => issue.issue_type === type).length
    })
    return Object.entries(counts).map(([key, value]) => ({ name: t(`issues.${key}`), value }))
  }, [issues, t])

  const issuesByPriority = useMemo(() => {
    const counts = {}
    Object.values(ISSUE_PRIORITIES).forEach((priority) => {
      counts[priority] = issues.filter((issue) => issue.priority === priority).length
    })
    return Object.entries(counts).map(([key, value]) => ({ name: t(`issues.${key}`), value, color: COLORS[key] }))
  }, [issues, t])

  if (loadingCustomers || loadingVisits || loadingIssues) {
    return (
      <div className="p-4 sm:p-6">
        <Spinner label={t('common.loadingData')} />
      </div>
    )
  }

  const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{t('reports.title')}</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <ChartCard title={t('reports.refrigeratorsByStatus')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={refrigeratorsByStatus} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {refrigeratorsByStatus.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.visitsByDay')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitsByDay} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.visitsBySupervisor')}>
          {visitsBySupervisor.length === 0 ? (
            <EmptyState title={t('reports.noData')} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitsBySupervisor} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="grid gap-6">
          <ChartCard title={t('reports.issuesByType')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuesByType} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="mt-6">
        <ChartCard title={t('reports.issuesByPriority')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={issuesByPriority} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {issuesByPriority.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
