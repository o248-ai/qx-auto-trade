import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useTheme } from '../../ThemeContext'
import { Siren, AlertTriangle, Power, Wrench, Loader2, X, ShieldAlert, UserPlus, LogIn, Brain } from 'lucide-react'

export default function AdminEmergency() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [stats, setStats] = useState({})
  const [statsLoading, setStatsLoading] = useState(true)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const fetchStats = async () => {
    setStatsLoading(true)
    try { const data = await api.getAdminStats(); setStats(data) } catch {} finally { setStatsLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const handleGlobalStop = async () => {
    setLoading(true)
    try { await api.globalEmergencyStop({}); showToast('Global emergency stop activated'); fetchStats() }
    catch (e) { showToast(e.message, 'error') } finally { setLoading(false) }
  }

  const handleClearStop = async () => {
    setLoading(true)
    try { await api.clearEmergencyStop({}); showToast('Emergency stop cleared'); fetchStats() }
    catch (e) { showToast(e.message, 'error') } finally { setLoading(false) }
  }

  const handleToggle = async (key, value) => {
    setLoading(true)
    try { await api.toggleEmergencyControl({ controlKey: key, enabled: value, key, value }); showToast(`${key} ${value ? 'enabled' : 'disabled'}`); fetchStats() }
    catch (e) { showToast(e.message, 'error') } finally { setLoading(false) }
  }

  const handleMaintenance = async (enabled) => {
    setLoading(true)
    try { await api.toggleMaintenance({ enabled }); showToast(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`); fetchStats() }
    catch (e) { showToast(e.message, 'error') } finally { setLoading(false) }
  }

  const handleResetDefaults = async () => {
    setLoading(true)
    try {
      await api.toggleEmergencyControl({ controlKey: 'userRegistrationEnabled', enabled: true })
      await api.toggleEmergencyControl({ controlKey: 'userLoginEnabled', enabled: true })
      await api.toggleEmergencyControl({ controlKey: 'tradingStrategiesEnabled', enabled: true })
      showToast('All controls restored to Default ON (Active)')
      fetchStats()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const controls = [
    { key: 'userRegistrationEnabled', label: 'User Registration', desc: 'Allow new user sign-ups (Default: ON / ALLOWED)', icon: UserPlus, enabled: stats.systemConfig?.emergencyControls?.userRegistrationEnabled !== false },
    { key: 'userLoginEnabled', label: 'User Login', desc: 'Allow users to log in (Default: ON / ACTIVE)', icon: LogIn, enabled: stats.systemConfig?.emergencyControls?.userLoginEnabled !== false },
    { key: 'tradingStrategiesEnabled', label: 'Trading Strategies', desc: 'Allow strategy execution (Default: ON / ACTIVE)', icon: Brain, enabled: stats.systemConfig?.emergencyControls?.tradingStrategiesEnabled !== false },
  ]

  if (statsLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>

  return (
    <div className="space-y-4 max-w-3xl">
      {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{toast.msg}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Emergency Controls</h1>
          <p className="text-xs text-gray-500">Critical platform safety switches (Default: All ON / Active)</p>
        </div>
        <button
          onClick={handleResetDefaults}
          disabled={loading}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          Restore All Controls to ON (Active)
        </button>
      </div>

      <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${isDark ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
        <span>ℹ️</span>
        <span><strong>Safety Notice:</strong> User Registration is configured to remain <strong>ON (Active)</strong> by default so new clients can always register. Only toggle OFF if you wish to temporarily freeze registrations.</span>
      </div>

      {/* Global Emergency Stop */}
      <div className={`rounded-xl border-2 p-5 ${isDark ? 'bg-gray-800 border-red-500/30' : 'bg-white border-red-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-red-500" /></div>
          <div>
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Global Emergency Stop</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Halt all trading platform-wide</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stats.systemConfig?.globalEmergencyStop ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {stats.systemConfig?.globalEmergencyStop ? 'STOP ACTIVE' : 'All Systems Normal'}
        </span>
        <div className="flex gap-3 mt-4">
          <button onClick={handleGlobalStop} disabled={loading || stats.systemConfig?.globalEmergencyStop} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <Siren className="w-3.5 h-3.5" />{loading ? 'Processing...' : 'Emergency Stop'}
          </button>
          <button onClick={handleClearStop} disabled={loading || !stats.systemConfig?.globalEmergencyStop} className={`flex-1 py-2.5 border rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Power className="w-3.5 h-3.5" />Clear Stop
          </button>
        </div>
      </div>

      {/* System Controls */}
      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>System Controls</h2>
        <div className="space-y-3">
          {controls.map((ctrl) => (
            <div key={ctrl.key} className={`flex items-center justify-between py-3 ${isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'} last:border-0`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}><ctrl.icon className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} /></div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{ctrl.label}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{ctrl.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${ctrl.enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {ctrl.enabled ? 'ON (ACTIVE)' : 'OFF (RESTRICTED)'}
                </span>
                <button onClick={() => handleToggle(ctrl.key, !ctrl.enabled)} disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ctrl.enabled ? 'bg-emerald-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ctrl.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}><Wrench className="w-4 h-4 text-amber-500" /></div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Maintenance Mode</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Show maintenance page to all users</p>
            </div>
          </div>
          <button onClick={() => handleMaintenance(!stats.systemConfig?.maintenanceMode)} disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${stats.systemConfig?.maintenanceMode ? 'bg-amber-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stats.systemConfig?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
