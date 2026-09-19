import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import UserLayout from './pages/user/UserLayout'
import UserDashboard from './pages/user/Dashboard'
import UserStrategies from './pages/user/Strategies'
import UserSettings from './pages/user/Settings'
import UserHistory from './pages/user/History'
import UserPerformance from './pages/user/Performance'
import UserSubscriptions from './pages/user/Subscriptions'
import UserSupport from './pages/user/Support'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminStrategies from './pages/admin/Strategies'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminPlanManager from './pages/admin/PlanManager'
import AdminSiteConfig from './pages/admin/SiteConfig'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminEmergency from './pages/admin/Emergency'
import AdminLiveSessions from './pages/admin/LiveSessions'
import AdminDeposits from './pages/admin/Deposits'
import AdminLogin from './pages/admin/AdminLogin'
import Landing from './pages/Landing'

function ProtectedUserRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (user) return children
  return <Navigate to="/" replace />
}

function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  if (admin) return children
  return <Navigate to="/admin/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />

      <Route element={<ProtectedUserRoute><UserLayout /></ProtectedUserRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/strategies" element={<UserStrategies />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/history" element={<UserHistory />} />
        <Route path="/performance" element={<UserPerformance />} />
        <Route path="/subscriptions" element={<UserSubscriptions />} />
        <Route path="/support" element={<UserSupport />} />
      </Route>

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/strategies" element={<AdminStrategies />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/plan-manager" element={<AdminPlanManager />} />
        <Route path="/admin/site-config" element={<AdminSiteConfig />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/emergency" element={<AdminEmergency />} />
        <Route path="/admin/live-sessions" element={<AdminLiveSessions />} />
        <Route path="/admin/deposits" element={<AdminDeposits />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
