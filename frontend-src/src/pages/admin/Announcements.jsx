import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useTheme } from '../../ThemeContext'
import {
  Megaphone, Plus, Trash2, X, Power, PowerOff, Loader2,
  AlertCircle, Info, CheckCircle2, RefreshCw, Radio
} from 'lucide-react'

// Helper to safely render target whether it is a string or an object like { homePage: true, userPage: true }
function formatTarget(target) {
  if (!target) return 'All'
  if (typeof target === 'string') return target
  if (typeof target === 'object') {
    const activeKeys = Object.keys(target).filter(k => Boolean(target[k]))
    if (activeKeys.length === 0) return 'All'
    return activeKeys
      .map(k => k.replace(/Page$/i, '').replace(/([A-Z])/g, ' $1').trim())
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(', ')
  }
  return String(target)
}

function formatType(type) {
  if (!type) return 'info'
  if (typeof type === 'string') return type.toLowerCase()
  return 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (_) {
    return ''
  }
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', type: 'info', target: 'all' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const fetchAnnouncements = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const data = await api.getAdminAnnouncements()
      const raw = data?.announcements || data || []
      const list = Array.isArray(raw) ? raw : []
      setAnnouncements(list)
    } catch (err) {
      console.error('[AdminAnnouncements] Fetch error:', err)
      setError(err.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.createAnnouncement(form)
      setShowCreate(false)
      setForm({ title: '', content: '', type: 'info', target: 'all' })
      setSuccess('Announcement published successfully!')
      setTimeout(() => setSuccess(''), 4000)
      fetchAnnouncements()
    } catch (err) {
      setError(err.message || 'Failed to publish announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (announcement) => {
    setError('')
    try {
      const annId = announcement.id || announcement._id
      const isCurrentlyActive = (announcement.isActive !== undefined)
        ? Boolean(announcement.isActive)
        : Boolean(announcement.active)
      await api.toggleAnnouncementActive({
        announcementId: annId,
        isActive: !isCurrentlyActive,
        active: !isCurrentlyActive
      })
      setSuccess(`Announcement set to ${!isCurrentlyActive ? 'Active' : 'Inactive'}`)
      setTimeout(() => setSuccess(''), 3000)
      fetchAnnouncements()
    } catch (err) {
      setError(err.message || 'Failed to update announcement status')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    setError('')
    try {
      const annId = deleteTarget.id || deleteTarget._id
      await api.deleteAnnouncement({ announcementId: annId })
      setDeleteTarget(null)
      setSuccess('Announcement deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
      fetchAnnouncements()
    } catch (err) {
      setError(err.message || 'Failed to delete announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const typeConfig = (type) => {
    const t = formatType(type)
    switch (t) {
      case 'warning':
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
          badge: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
          bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50'
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          badge: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200',
          bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50'
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
          badge: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
        }
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-500" />,
          badge: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200',
          bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50'
        }
    }
  }

  const safeAnnouncements = Array.isArray(announcements) ? announcements : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Announcements
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isDark ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {safeAnnouncements.length} {safeAnnouncements.length === 1 ? 'Total' : 'Total'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Broadcast real-time system alerts, updates, and notices to users and traders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing || loading}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title="Refresh Announcements"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setForm({ title: '', content: '', type: 'info', target: 'all' })
              setShowCreate(true)
              setError('')
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
          isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:opacity-75 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
          isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:opacity-75 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {loading ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center shadow-sm`}>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading announcements...</p>
          </div>
        ) : safeAnnouncements.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center shadow-sm space-y-3`}>
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>No announcements found</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Create your first announcement to broadcast updates to traders.</p>
            </div>
            <button
              onClick={() => {
                setForm({ title: '', content: '', type: 'info', target: 'all' })
                setShowCreate(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Announcement
            </button>
          </div>
        ) : (
          safeAnnouncements.map((a, idx) => {
            const annId = a.id || a._id || `ann-${idx}`
            const isActive = (a.isActive !== undefined) ? Boolean(a.isActive) : Boolean(a.active)
            const typeInfo = typeConfig(a.type)
            const targetText = formatTarget(a.target)
            const titleText = typeof a.title === 'string' ? a.title : (a.title ? String(a.title) : 'Untitled')
            const contentText = typeof a.content === 'string' ? a.content : (a.content ? String(a.content) : '')
            const dateText = formatDate(a.createdAt)

            return (
              <div
                key={annId}
                className={`${isDark ? 'bg-gray-800/90 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'} rounded-2xl border p-5 transition-all shadow-sm`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.bg} border border-transparent`}>
                      {typeInfo.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={`text-sm font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {titleText}
                        </h3>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isActive
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {contentText}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        {/* Type badge */}
                        <span className={`px-2 py-0.5 rounded-md font-medium capitalize border ${typeInfo.badge}`}>
                          {formatType(a.type)}
                        </span>

                        {/* Target badge */}
                        <span className={`px-2 py-0.5 rounded-md font-medium border ${
                          isDark ? 'bg-gray-700/60 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          Target: {targetText}
                        </span>

                        {dateText && (
                          <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            • {dateText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <button
                      onClick={() => handleToggle(a)}
                      className={`p-2 rounded-xl transition-all border ${
                        isActive
                          ? isDark
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                          : isDark
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={isActive ? 'Deactivate Announcement' : 'Activate Announcement'}
                    >
                      {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setDeleteTarget(a)
                        setError('')
                      }}
                      className={`p-2 rounded-xl transition-all border ${
                        isDark
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-lg border overflow-hidden ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className={`text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  New Announcement
                </h3>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Scheduled OTC Volatility Server Maintenance"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    isDark ? 'bg-gray-700/70 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content / Message
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  placeholder="Enter the announcement message to display on user screens..."
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all ${
                    isDark ? 'bg-gray-700/70 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Alert Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      isDark ? 'bg-gray-700/70 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="error">Error / Urgent (Red)</option>
                    <option value="success">Success (Green)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Target Audience
                  </label>
                  <select
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      isDark ? 'bg-gray-700/70 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Users & Visitors</option>
                    <option value="free">Free Trial Users</option>
                    <option value="basic">Basic Plan Traders</option>
                    <option value="premium">Premium Plan VIPs</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Announcement'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-md border p-6 space-y-4 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  Delete Announcement
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete &quot;
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deleteTarget.title || 'Untitled'}
              </span>
              &quot;?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
