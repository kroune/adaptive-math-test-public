import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import TestFlow from './features/test-flow/pages/TestFlow';

const AdminLogin = lazy(() => import('./features/admin/pages/AdminLogin'));
const AdminLayout = lazy(() => import('./features/admin/pages/AdminLayout'));
const ItemsPage = lazy(() => import('./features/admin/pages/ItemsPage'));
const MotivationPage = lazy(() => import('./features/admin/pages/MotivationPage'));
const SessionsPage = lazy(() => import('./features/admin/pages/SessionsPage'));
const SessionDetailPage = lazy(() => import('./features/admin/pages/SessionDetailPage'));
const AlgorithmPage = lazy(() => import('./features/admin/pages/AlgorithmPage'));
const TopicsPage = lazy(() => import('./features/admin/pages/TopicsPage'));
const LinearTestPage = lazy(() => import('./features/admin/pages/LinearTestPage'));

// Protects admin routes: redirects to /admin/login when there is no session.
// Pure render — reads from context, no effects, no refs.
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Проверка авторизации...
      </div>
    );
  }

  return session ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

// Protects the login route: redirects authenticated users away from /admin/login.
// Navigation happens when AuthContext updates from the SIGNED_IN event —
// not immediately after signInWithPassword — eliminating the race condition.
function AdminLoginRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Проверка авторизации...
      </div>
    );
  }

  return session ? <Navigate to="/admin/topics" replace /> : <AdminLogin />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
          {/* Child test flow */}
          <Route path="/" element={<TestFlow />} />

          {/* Admin — loaded lazily, never downloaded by children taking the test */}
          <Route path="/admin/login" element={
            <Suspense fallback={null}>
              <AdminLoginRoute />
            </Suspense>
          } />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <Suspense fallback={null}>
                  <AdminLayout />
                </Suspense>
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="/admin/topics" replace />} />
            <Route path="topics" element={<Suspense fallback={null}><TopicsPage /></Suspense>} />
            <Route path="items" element={<Suspense fallback={null}><ItemsPage /></Suspense>} />
            <Route path="motivation" element={<Suspense fallback={null}><MotivationPage /></Suspense>} />
            <Route path="linear-test" element={<Suspense fallback={null}><LinearTestPage /></Suspense>} />
            <Route path="algorithm" element={<Suspense fallback={null}><AlgorithmPage /></Suspense>} />
            <Route path="sessions" element={<Suspense fallback={null}><SessionsPage /></Suspense>} />
            <Route path="sessions/:sessionId" element={<Suspense fallback={null}><SessionDetailPage /></Suspense>} />
          </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
