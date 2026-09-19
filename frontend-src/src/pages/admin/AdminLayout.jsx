import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import {
  LayoutDashboard, Users, Brain, CreditCard, Wallet, Megaphone,
  Radio, FileText, Settings, AlertTriangle, Shield, Lock, Key, Activity,
  Siren, LogOut, Menu, X, ShieldCheck, Sun, Moon, Package
} from 'lucide-react'
import ChangeAdminPasswordModal from '../../components/ChangeAdminPasswordModal'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/strategies', label: 'Strategies', icon: Brain },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/plan-manager', label: 'Plan Manager', icon: Package },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/site-config', label: 'Site Config', icon: Settings },
  { to: '/admin/emergency', label: 'Emergency', icon: Siren },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const { admin, logoutAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin')
  }

  return (
    <div className={`min-h-screen flex transition-colors ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:z-auto ${
        isDark ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`h-14 flex items-center gap-2.5 px-4 shrink-0 ${isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'}`}>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>QX Auto Trade</p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
            <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <div className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700'
                    : isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={`p-2 space-y-1 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
          <button onClick={() => { setSidebarOpen(false); setPasswordModalOpen(true); }}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <Key className="w-4 h-4 text-blue-500" />
            <span>Change Password</span>
          </button>
          <button onClick={handleLogout}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isDark ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
            }`}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30 backdrop-blur-md ${
          isDark ? 'bg-gray-800/80 border-b border-gray-700' : 'bg-white/80 border-b border-gray-200'
        }`}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
          <div className="flex-1" />

          <button
            onClick={() => setPasswordModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
              isDark
                ? 'bg-gray-700/80 hover:bg-gray-600 text-gray-200 border border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
            }`}
            title="Change Admin Password"
          >
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>Change Password</span>
          </button>

          <button onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className={`hidden sm:flex items-center gap-2.5 pl-3 ${isDark ? 'border-l border-gray-700' : 'border-l border-gray-200'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              {(admin?.name || admin?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{admin?.name || admin?.email || 'Admin'}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ChangeAdminPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  )
}
