import React, { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { getMeThunk } from '@/features/auth/slices/authSlice'
import { useAppDispatch } from '@/hooks'
import DashboardLayout from '@/layouts/DashboardLayout'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

const LoginForm       = lazy(() => import('@/features/auth/components/LoginForm'))
const SignupForm      = lazy(() => import('@/features/auth/components/SignupForm'))
const DashboardPage   = lazy(() => import('@/pages/DashboardPage'))
const TicketsListPage = lazy(() => import('@/pages/TicketsListPage'))
const CreateTicketPage= lazy(() => import('@/pages/CreateTicketPage'))
const TicketDetailPage= lazy(() => import('@/pages/TicketDetailPage'))
const AnalyticsPage   = lazy(() => import('@/pages/AnalyticsPage'))
const SLAConfigPage        = lazy(() => import('@/pages/SLAConfigPage'))
const EscalatedTicketsPage   = lazy(() => import('@/pages/Escalatedticketspage'))
const UnassignedTicketsPage  = lazy(() => import('@/pages/UnassignedTicketsPage'))
const KeywordRulesPage= lazy(() => import('@/pages/KeywordRulesPage'))
const UsersPage       = lazy(() => import('@/pages/UsersPage'))
const TeamsPage       = lazy(() => import('@/pages/TeamsPage'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AuthInitializer() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAuth()
  useEffect(() => {
    if (isAuthenticated && !user) dispatch(getMeThunk())
  }, [isAuthenticated])
  return null
}

export default function AppRoutes() {
  return (
    <>
      <AuthInitializer />
      <Suspense fallback={<LoadingSpinner fullPage text="Loading…" />}>
        <Routes>
          <Route path="/login"  element={<PublicOnlyRoute><LoginForm /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignupForm /></PublicOnlyRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/*" element={
            <PrivateRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingSpinner fullPage />}>
                  <Routes>
                    <Route path="/dashboard"        element={<DashboardPage />} />
                    <Route path="/tickets"          element={<TicketsListPage />} />
                    <Route path="/tickets/create"   element={<CreateTicketPage />} />
                    <Route path="/tickets/queue"    element={<TicketsListPage />} />
                    <Route path="/tickets/escalated"   element={<EscalatedTicketsPage />} />
                    <Route path="/tickets/unassigned" element={
                      <RoleRoute roles={['team_lead', 'admin']}><UnassignedTicketsPage /></RoleRoute>
                    } />
                    <Route path="/tickets/:id"      element={<TicketDetailPage />} />
                    <Route path="/analytics" element={
                      <RoleRoute roles={['team_lead', 'admin']}><AnalyticsPage /></RoleRoute>
                    } />
                    <Route path="/reports" element={
                      <RoleRoute roles={['admin']}><AnalyticsPage /></RoleRoute>
                    } />
                    <Route path="/sla-config" element={
                      <RoleRoute roles={['team_lead', 'admin']}><SLAConfigPage /></RoleRoute>
                    } />
                    <Route path="/keyword-rules" element={
                      <RoleRoute roles={['team_lead', 'admin']}><KeywordRulesPage /></RoleRoute>
                    } />
                    <Route path="/users" element={
                      <RoleRoute roles={['admin']}><UsersPage /></RoleRoute>
                    } />
                    <Route path="/teams" element={
                      <RoleRoute roles={['admin']}><TeamsPage /></RoleRoute>
                    } />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </DashboardLayout>
            </PrivateRoute>
          } />
        </Routes>
      </Suspense>
    </>
  )
}