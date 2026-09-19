import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'
import { useTheme } from '../../ThemeContext'
import {
  Radio, RefreshCw, AlertTriangle, Loader2, TrendingUp, TrendingDown,
  Activity, Search, Clock, User, ShieldCheck, Zap, Filter
} from 'lucide-react'

export default function AdminLiveSessions() {
  const [sessions, setSessions] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stopping, setStopping] = useState(null)
  const [activeTab, setActiveTab] = useState('activity') // 'activity' or 'sessions'
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const intervalRef = useRef(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const fetchData = async () => {
    try {
      const data = await api.getLiveSessions()
      setSessions(data.sessions || [])
      setActivityLogs(data.activityLogs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleForceStop = async (session) => {
    setStopping(session.id || session.userId)
    try {
      await api.stopTrading({ userId: session.userId || session.id })
      fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setStopping(null)
    }
  }

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now'
    try {
      const d = new Date(ts)
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    } catch (e) {
      return ts
    }
  }

  const getActionBadgeColor = (action) => {
    const act = (action || '').toUpperCase()
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'
    }
    if (act.includes('TRADE') || act.includes('ORDER') || act.includes('WIN')) {
      return isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    if (act.includes('STOP') || act.includes('DELETE') || act.includes('DEACTIVATE') || act.includes('REJECT')) {
      return isDark ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'
    }
    if (act.includes('PLAN') || act.includes('DEPOSIT') || act.includes('SUBSCRIPTION') || act.includes('PAYMENT')) {
      return isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
    }
    return isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
  }

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      (log.actorEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.userId || '').toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false
    if (actionFilter === 'ALL') return true
    if (actionFilter === 'LOGINS') return (log.action || '').includes('LOGIN') || (log.action || '').includes('AUTH')
    if (actionFilter === 'TRADES') return (log.action || '').includes('TRADE') || (log.action || '').includes('BOT')
    if (actionFilter === 'SUBSCRIPTIONS') return (log.action || '').includes('PLAN') || (log.action || '').includes('DEPOSIT') || (log.action || '').includes('REF')
    if (actionFilter === 'ADMIN') return (log.actorEmail || '').includes('admin') || (log.action || '').includes('ADMIN') || (log.action || '').includes('STATUS')
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Live Sessions &amp; User Activity Logs
              </h1>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Real-time monitor • {sessions.length} active session{sessions.length !== 1 ? 's' : ''} • {activityLogs.length} total user logs • Auto-refreshing every 10s
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className={`inline-flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors shadow-sm ${
            isDark
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Now
        </button>
      </div>

      {error && (
        <div className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
          isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={`flex items-center gap-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} pb-1`}>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          All Users Activity Logs ({activityLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          Active Engine Sessions ({sessions.length})
        </button>
      </div>

      {/* Tab 1: All Users Activity Logs */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search by user email, action, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'LOGINS', 'TRADES', 'SUBSCRIPTIONS', 'ADMIN'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActionFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                    actionFilter === f
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : isDark
                      ? 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className={`rounded-xl border overflow-hidden shadow-sm ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <th className="px-4 py-3.5">User / Actor</th>
                    <th className="px-4 py-3.5">Action</th>
                    <th className="px-4 py-3.5">Activity Details</th>
                    <th className="px-4 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        <span className="text-xs">Loading activity logs...</span>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center text-gray-400 text-sm">
                        No activity logs found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr
                        key={log.id || idx}
                        className={`transition-colors ${isDark ? 'hover:bg-gray-750/50' : 'hover:bg-gray-50/70'}`}
                      >
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className={`font-semibold text-xs ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                {log.actorEmail || log.userEmail || log.userId || 'System'}
                              </p>
                              {log.userId && log.userId !== log.actorEmail && (
                                <p className="text-[10px] text-gray-400 font-mono">{log.userId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadgeColor(log.action)}`}>
                            {log.action || 'ACTIVITY'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            {log.details || log.message || 'Action executed successfully.'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(log.timestamp || log.createdAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Active Trading Engine Sessions */}
      {activeTab === 'sessions' && (
        <div className={`rounded-xl border overflow-hidden shadow-sm ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Broker</th>
                  <th className="px-4 py-3.5">Strategy</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Session P&amp;L</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      <span className="text-xs">Loading sessions...</span>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-sm">
                      <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No active trading engine sessions currently running.
                      <p className="text-xs mt-1 text-gray-500">Mobile app users execute continuous auto-trades and report activities directly in the Activity Logs tab.</p>
                    </td>
                  </tr>
                ) : (
                  sessions.map((s, i) => (
                    <tr key={s.id || i} className={`transition-colors ${isDark ? 'hover:bg-gray-750/50' : 'hover:bg-gray-50/70'}`}>
                      <td className="px-4 py-3">
                        <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{s.userName || s.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{s.userEmail || s.user?.email || ''}</p>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.broker || 'Quotex'}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.strategy || s.strategyName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                          (s.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {(s.pnl || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          ${(s.pnl || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleForceStop(s)}
                          disabled={stopping === (s.id || s.userId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {stopping === (s.id || s.userId) ? 'Stopping...' : 'Force Stop'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
