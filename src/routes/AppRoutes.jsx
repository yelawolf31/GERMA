import { lazy, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import Login from '../pages/Login'
import DashboardLayout from '../layouts/DashboardLayout'
import { ProtectedRoute, RoleRoute } from './guards'
import { ROLES } from '../constants/roles'
import { useTranslation } from '../i18n'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const MapPage = lazy(() => import('../pages/MapPage'))
const Customers = lazy(() => import('../pages/Customers'))
const CustomerDetails = lazy(() => import('../pages/CustomerDetails'))
const AddCustomer = lazy(() => import('../pages/AddCustomer'))
const Refrigerators = lazy(() => import('../pages/Refrigerators'))
const RefrigeratorDetails = lazy(() => import('../pages/RefrigeratorDetails'))
const AddRefrigerator = lazy(() => import('../pages/AddRefrigerator'))
const Visits = lazy(() => import('../pages/Visits'))
const VisitDetails = lazy(() => import('../pages/VisitDetails'))
const RecordVisit = lazy(() => import('../pages/RecordVisit'))
const Issues = lazy(() => import('../pages/Issues'))
const Reports = lazy(() => import('../pages/Reports'))
const Settings = lazy(() => import('../pages/Settings'))
const Users = lazy(() => import('../pages/Users'))
const UserDetails = lazy(() => import('../pages/UserDetails'))
const AuditLogs = lazy(() => import('../pages/AuditLogs'))
const NotFound = lazy(() => import('../pages/NotFound'))

function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label={t('common.loading')} />
    </div>
  )
}

function withSuspense(Element) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Element />
    </Suspense>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={withSuspense(Dashboard)} />
          <Route path="/map" element={withSuspense(MapPage)} />
          <Route path="/customers" element={withSuspense(Customers)} />
          <Route path="/customers/add" element={withSuspense(AddCustomer)} />
          <Route path="/customers/:id" element={withSuspense(CustomerDetails)} />
          <Route path="/refrigerators" element={withSuspense(Refrigerators)} />
          <Route path="/refrigerators/add" element={withSuspense(AddRefrigerator)} />
          <Route path="/refrigerators/:id" element={withSuspense(RefrigeratorDetails)} />
          <Route path="/visits" element={withSuspense(Visits)} />
          <Route path="/visits/:visitId" element={withSuspense(VisitDetails)} />
          <Route path="/visits/record/:customerId" element={withSuspense(RecordVisit)} />
          <Route path="/issues" element={withSuspense(Issues)} />
          <Route path="/reports" element={withSuspense(Reports)} />
          <Route path="/settings" element={withSuspense(Settings)} />

          <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/users" element={withSuspense(Users)} />
            <Route path="/users/:id" element={withSuspense(UserDetails)} />
            <Route path="/audit-logs" element={withSuspense(AuditLogs)} />
            <Route path="/customers/edit/:id" element={withSuspense(AddCustomer)} />
            <Route path="/refrigerators/edit/:id" element={withSuspense(AddRefrigerator)} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={withSuspense(NotFound)} />
    </Routes>
  )
}
