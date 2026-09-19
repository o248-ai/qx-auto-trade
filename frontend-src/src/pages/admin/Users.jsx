import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useTheme } from '../../ThemeContext'
import {
  Users as UsersIcon, Plus, Pencil, Trash2, RefreshCw, Search,
  X, Power, PowerOff, ShieldOff, Key, ChevronDown, Loader2, Check, Download
} from 'lucide-react'

const emptyForm = { name: '', email: '', password: '', subscriptionPlan: 'Free Trial' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [resetPwdUser, setResetPwdUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminUsers()
      const rawUsers = data.users || data || []
      const sorted = [...rawUsers].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setUsers(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.addAdminUser(form)
      setShowAdd(false)
      setForm(emptyForm)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.editUserDetails({
        userId: editUser.id,
        subscriptionPlan: form.plan,
        plan: form.plan,
        name: form.name,
        email: form.email,
        planExpiresAt: form.planExpiresAt || null,
        isActive: form.isActive !== false,
        active: form.isActive !== false
      })
      setEditUser(null)
      setForm(emptyForm)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.deleteAdminUser({ userId: deleteUser.id })
      setSelected((prev) => prev.filter((id) => id !== deleteUser.id))
      setDeleteUser(null)
      showToast('User deleted permanently')
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      await api.bulkDeleteAdminUsers({ userIds: selected })
      showToast(`Successfully deleted ${selected.length} users permanently`)
      setBulkDeleteConfirm(false)
      setSelected([])
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selected.length === filtered.length && filtered.length > 0) {
      setSelected([])
    } else {
      setSelected(filtered.map((u) => u.id))
    }
  }

  const handleToggle = async (user) => {
    try {
      const isCurrentlyActive = (user.isActive !== false && user.active !== false);
      await api.toggleUserActive({ userId: user.id, isActive: !isCurrentlyActive, active: !isCurrentlyActive })
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleForceStop = async (user) => {
    try {
      await api.forceStopUser({ userId: user.id })
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.resetUserPassword({ userId: resetPwdUser.id, newPassword })
      setResetPwdUser(null)
      setNewPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (user) => {
    const expDate = user.planExpiresAt || user.subExpiresAt || '';
    setForm({
      name: user.name || '',
      email: user.email || '',
      plan: user.subscriptionPlan || user.plan || 'Free Trial',
      planExpiresAt: expDate ? new Date(expDate).toISOString().slice(0, 16) : '',
      isActive: (user.isActive !== false && user.active !== false),
      password: ''
    })
    setEditUser(user)
  }

  const handleExportUsers = () => {
    if (!users || users.length === 0) {
      showToast('No users available to export', 'error')
      return
    }

    const headers = [
      'User ID',
      'Name',
      'Email',
      'Role',
      'Subscription Plan',
      'Plan Expiration',
      'Lifetime VIP Approved',
      'Active Status',
      'Deposit Verified',
      'Referral UID',
      'Phone',
      'Country',
      'Created At'
    ]

    const csvRows = [headers.join(',')]

    users.forEach((u) => {
      const row = [
        `"${u.id || ''}"`,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${u.role || 'USER'}"`,
        `"${u.subscriptionPlan || u.plan || 'Free Trial'}"`,
        `"${u.planExpiresAt || u.subExpiresAt || ''}"`,
        `"${u.isLifetimeApproved ? 'YES' : 'NO'}"`,
        `"${(u.isActive !== false && u.active !== false) ? 'ACTIVE' : 'DEACTIVATED'}"`,
        `"${u.depositVerified ? 'YES' : 'NO'}"`,
        `"${u.referralUid || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.country || ''}"`,
        `"${u.createdAt || ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    link.setAttribute('download', `quotex_users_export_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${users.length} users successfully!`, 'success')
  }

  const handleReactivateTrial = async () => {
    if (!editUser) return;
    setSubmitting(true)
    setError('')
    try {
      await api.reactivateFreeTrial({ userId: editUser.id })
      setEditUser(null)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>{toast.msg}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Users</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportUsers}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors shadow-sm cursor-pointer ${
              isDark ? 'border-gray-700 text-emerald-400 hover:bg-gray-700' : 'border-gray-200 text-emerald-600 hover:bg-gray-50'
            }`}
            title="Download CSV export of all users"
          >
            <Download className="w-4 h-4" />
            Export Users
          </button>
          <button
            onClick={fetchUsers}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
              isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => { setForm(emptyForm); setShowAdd(true); setError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-red-500/10 border border-red-500/30 text-sm text-red-400' : 'bg-red-50 border border-red-200 text-sm text-red-700'}`}>
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="relative max-w-sm">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selected.length > 0 && (
          <div className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'bg-blue-900/20 border-blue-800/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                {selected.length} user{selected.length === 1 ? '' : 's'} selected
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs underline hover:opacity-80 font-medium cursor-pointer"
              >
                {selected.length === filtered.length ? 'Deselect All' : 'Select All Filtered'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selected.length})
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50/50'}`}>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    title="Select All"
                    className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                  />
                </th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>User ID</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plan</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Created</th>
                <th className={`text-right px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className={`px-4 py-12 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`px-4 py-12 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b transition-colors ${
                      selected.includes(user.id)
                        ? (isDark ? 'bg-blue-600/15 border-blue-800/40' : 'bg-blue-50/70 border-blue-100')
                        : (isDark ? 'border-gray-800 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50/50')
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-primary-600'}`}>{user.id}</td>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{user.name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {user.subscriptionPlan || user.plan || 'Free Trial'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        (user.isActive !== false && user.active !== false)
                          ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
                          : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700')
                      }`}>
                        {(user.isActive !== false && user.active !== false) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(user)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                          title={(user.isActive !== false && user.active !== false) ? 'Deactivate' : 'Activate'}
                        >
                          {(user.isActive !== false && user.active !== false) ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleForceStop(user)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          title="Force Stop Trading"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setResetPwdUser(user); setNewPassword(''); setError(''); }}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeleteUser(user); setError(''); }}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal title="Add User" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Input label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
            <Select label="Plan" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} options={['free', 'basic', 'premium', 'enterprise']} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors">
                {submitting ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Select label="Plan" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} options={['Free Trial', 'Basic Plan', 'Pro Plan', 'Quantum Plan', 'Premium Plan', 'Lifetime Free']} />
            <Select
              label="Account Status"
              value={form.isActive ? 'Active' : 'Inactive'}
              onChange={(v) => setForm({ ...form, isActive: v === 'Active' })}
              options={['Active', 'Inactive']}
            />
            <Input label="Plan Expiry Date & Time" type="datetime-local" value={form.planExpiresAt || ''} onChange={(v) => setForm({ ...form, planExpiresAt: v })} />
            
            <div className={`p-3 rounded-lg border flex items-center justify-between ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-amber-50 border-amber-200'}`}>
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Free Trial Management</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Give user 1 hour free trial again</p>
              </div>
              <button
                type="button"
                onClick={handleReactivateTrial}
                disabled={submitting}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded shadow transition-colors"
              >
                ⚡ Re-activate 1 Hr Free Trial
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditUser(null)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors">
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteUser && (
        <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Are you sure you want to delete <strong>{deleteUser.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteUser(null)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
            <button onClick={handleDelete} disabled={submitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {submitting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <Modal title="Delete Selected Users" onClose={() => setBulkDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to permanently delete <strong className="text-red-500 font-bold">{selected.length}</strong> selected user account(s)?
            </p>
            <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              ⚠️ This action will permanently remove these users from the database, stop any active trading bots, and prevent their accounts from resurrecting.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {submitting ? 'Deleting...' : `Delete ${selected.length} Users`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password */}
      {resetPwdUser && (
        <Modal title="Reset Password" onClose={() => setResetPwdUser(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resetting password for <strong>{resetPwdUser.email}</strong></p>
            <Input label="New Password" type="password" value={newPassword} onChange={setNewPassword} required />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setResetPwdUser(null)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors">
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className={`relative rounded-xl shadow-xl w-full max-w-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
          <button onClick={onClose} className={isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Input({ label, type = 'text', value, onChange, required }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div>
      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
      />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div>
      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
        ))}
      </select>
    </div>
  )
}
