import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getMeThunk, refreshTokenThunk, logout } from '@/features/auth/slices/authSlice';
import { useAppDispatch } from '@/hooks';
import DashboardLayout from '@/layouts/DashboardLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// ── Auth / public pages ────────────────────────────────────────────────────────
const LoginForm          = lazy(() => import('@/features/auth/components/LoginForm'));
const SignupForm         = lazy(() => import('@/features/auth/components/SignupForm'));
const ForgotPasswordForm = lazy(() => import('@/features/auth/components/ForgotPasswordForm'));
const ResetPasswordForm  = lazy(() => import('@/features/auth/components/ResetPasswordForm'));

// ── Protected pages ────────────────────────────────────────────────────────────
const DashboardPage       = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const TicketsListPage     = lazy(() => import('@/features/tickets/pages/TicketsListPage'));
const CreateTicketPage    = lazy(() => import('@/features/tickets/pages/CreateTicketPage'));
const TicketDetailPage    = lazy(() => import('@/features/tickets/pages/TicketDetailPage'));
const AnalyticsPage       = lazy(() => import('@/features/analytics/pages/AnalyticsPage'));
const SLAConfigPage       = lazy(() => import('@/features/sla/pages/SLAConfigPage'));
const EscalatedTicketsPage  = lazy(() => import('@/features/tickets/pages/EscalatedTicketsPage'));
const UnassignedTicketsPage = lazy(() => import('@/features/tickets/pages/UnassignedTicketsPage'));
const OpenQueuePage       = lazy(() => import('@/features/tickets/pages/OpenQueuePage'));
const TeamTicketsPage     = lazy(() => import('@/features/tickets/pages/TeamTicketsPage'));
const KeywordRulesPage    = lazy(() => import('@/features/keywords/pages/KeywordRulesPage'));
const UsersPage           = lazy(() => import('@/features/users/pages/UsersPage'));
const TeamsPage           = lazy(() => import('@/features/users/pages/TeamsPage'));
const ProductsPage        = lazy(() => import('@/features/product/pages/ProductsPage'));
const SubscriptionPage    = lazy(() => import('@/features/subscription/pages/SubscriptionPage'));
const EmailConfigPage     = lazy(() => import('@/features/email-config/pages/EmailConfigPage'));

// ── Route guards ───────────────────────────────────────────────────────────────

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullPage text="Restoring session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullPage text="Restoring session…" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ── Auth initializer ───────────────────────────────────────────────────────────
/**
 * Runs once on mount to rehydrate the session:
 *   1. Access token present & valid  → just fetch the user profile.
 *   2. Access token absent/expired   → attempt a silent refresh via the
 *      HttpOnly refresh-token cookie, then fetch the profile on success.
 *
 * A ref guard ensures the async flow is only triggered once, even in
 * React 18 Strict Mode (which double-invokes effects in development).
 */
function AuthInitializer() {
  const dispatch    = useAppDispatch();
  const { isAuthenticated, user, isLoading } = useAuth();
  const attempted   = useRef(false);               // ← prevents duplicate calls

  useEffect(() => {
    // Case 1: valid token, profile not yet loaded → fetch profile only
    if (isAuthenticated && !user) {
      dispatch(getMeThunk());
      return;
    }

    // Case 2: no valid token but a refresh might still be possible
    if (!isAuthenticated && isLoading && !attempted.current) {
      attempted.current = true;                    // ← guard against re-entry

      dispatch(refreshTokenThunk()).then((result) => {
        if (refreshTokenThunk.fulfilled.match(result)) {
          dispatch(getMeThunk());
        } else {
          dispatch(logout());
        }
      });
    }
  }, [isAuthenticated, isLoading, user, dispatch]); // ← all deps declared

  return null;
}

// ── Root router ────────────────────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <>
      <AuthInitializer />

      {/* Outer boundary: covers public/auth pages + the initial layout shell */}
      <Suspense fallback={<LoadingSpinner fullPage text="Loading…" />}>
        <Routes>
          {/* ── Public-only routes ── */}
          <Route path="/login"           element={<PublicOnlyRoute><LoginForm /></PublicOnlyRoute>} />
          <Route path="/signup"          element={<PublicOnlyRoute><SignupForm /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordForm /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<PublicOnlyRoute><ResetPasswordForm /></PublicOnlyRoute>} />

          {/* ── Root redirect ── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── Protected routes ── */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  {/*
                   * Inner boundary: shows a spinner *inside* the already-rendered
                   * layout shell (sidebar, nav) while a lazy page chunk is fetching.
                   * This prevents the entire shell from unmounting on page navigation.
                   */}
                  <Suspense fallback={<LoadingSpinner fullPage />}>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />

                      {/* ── Ticket routes ── */}
                      <Route path="/tickets"        element={<TicketsListPage />} />
                      <Route path="/tickets/create" element={<CreateTicketPage />} />
                      <Route path="/tickets/:id"    element={<TicketDetailPage />} />
                      <Route path="/tickets/escalated" element={<EscalatedTicketsPage />} />

                      <Route
                        path="/tickets/queue"
                        element={
                          <RoleRoute roles={['support_agent']}>
                            <OpenQueuePage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/tickets/team"
                        element={
                          <RoleRoute roles={['team_lead']}>
                            <TeamTicketsPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/tickets/unassigned"
                        element={
                          <RoleRoute roles={['team_lead', 'admin']}>
                            <UnassignedTicketsPage />
                          </RoleRoute>
                        }
                      />

                      {/* ── Analytics / reports ── */}
                      <Route
                        path="/analytics"
                        element={
                          <RoleRoute roles={['team_lead', 'admin']}>
                            <AnalyticsPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/reports"
                        element={
                          <RoleRoute roles={['admin']}>
                            <AnalyticsPage />
                          </RoleRoute>
                        }
                      />

                      {/* ── Config / admin ── */}
                      <Route
                        path="/sla-config"
                        element={
                          <RoleRoute roles={['team_lead', 'admin']}>
                            <SLAConfigPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/keyword-rules"
                        element={
                          <RoleRoute roles={['team_lead', 'admin']}>
                            <KeywordRulesPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <RoleRoute roles={['admin']}>
                            <UsersPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/teams"
                        element={
                          <RoleRoute roles={['admin']}>
                            <TeamsPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/products"
                        element={
                          <RoleRoute roles={['admin']}>
                            <ProductsPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/subscription"
                        element={
                          <RoleRoute roles={['user']}>
                            <SubscriptionPage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="/email-config"
                        element={
                          <RoleRoute roles={['admin']}>
                            <EmailConfigPage />
                          </RoleRoute>
                        }
                      />

                      {/* ── Fallback ── */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </DashboardLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}