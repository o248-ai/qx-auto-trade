import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useTheme } from '../../ThemeContext'
import {
  Brain, Plus, Pencil, Trash2, X, Power, PowerOff, RefreshCw, Loader2
} from 'lucide-react'

export default function AdminStrategies() {
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editStrategy, setEditStrategy] = useState(null)
  const [deleteStrategy, setDeleteStrategy] = useState(null)
  const [form, setForm] = useState({
    name: '', broker: 'quotex', timeframe: '1m', winRate: 85,
    rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30,
    emaFast: 9, emaSlow: 21,
    macdFast: 12, macdSlow: 26, macdSignal: 9,
  })
  const [params, setParams] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const fetchStrategies = async () => {
    setLoading(true)
    try {
      const data = await api.getStrategies({ includeInactive: 'true' })
      setStrategies(data.strategies || data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStrategies() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.addStrategy({
        ...form,
        broker: form.broker || 'quotex',
        winRate: Number(form.winRate || 85),
        parameters: {
          rsiPeriod: Number(form.rsiPeriod || 14),
          rsiOverbought: Number(form.rsiOverbought || 70),
          rsiOversold: Number(form.rsiOversold || 30),
          emaFast: Number(form.emaFast || 9),
          emaSlow: Number(form.emaSlow || 21),
          macdFast: Number(form.macdFast || 12),
          macdSlow: Number(form.macdSlow || 26),
          macdSignal: Number(form.macdSignal || 9),
        }
      })
      setShowAdd(false)
      resetForm()
      fetchStrategies()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.deleteStrategy({ strategyId: deleteStrategy.id, id: deleteStrategy.id })
      setDeleteStrategy(null)
      fetchStrategies()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (strategy) => {
    try {
      await api.toggleStrategyActive({
        strategyId: strategy.id,
        id: strategy.id,
        isActive: !strategy.isActive
      })
      fetchStrategies()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateParams = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.editStrategy({
        strategyId: editStrategy.id,
        id: editStrategy.id,
        name: params.name,
        broker: params.broker || editStrategy.broker || 'quotex',
        description: params.description,
        winRate: Number(params.winRate || 85),
        timeframe: params.timeframe,
        parameters: {
          rsiPeriod: Number(params.rsiPeriod || 14),
          rsiOverbought: Number(params.rsiOverbought || 70),
          rsiOversold: Number(params.rsiOversold || 30),
          emaFast: Number(params.emaFast || 9),
          emaSlow: Number(params.emaSlow || 21),
          macdFast: Number(params.macdFast || 12),
          macdSlow: Number(params.macdSlow || 26),
          macdSignal: Number(params.macdSignal || 9),
        }
      })
      setEditStrategy(null)
      fetchStrategies()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (strategy) => {
    setParams({
      name: strategy.name || '',
      description: strategy.description || '',
      winRate: strategy.winRate ?? 85,
      timeframe: strategy.timeframe || '1m',
      rsiPeriod: strategy.rsiPeriod ?? strategy.parameters?.rsiPeriod ?? 14,
      rsiOverbought: strategy.rsiOverbought ?? strategy.parameters?.rsiOverbought ?? 70,
      rsiOversold: strategy.rsiOversold ?? strategy.parameters?.rsiOversold ?? 30,
      emaFast: strategy.emaFast ?? strategy.parameters?.emaFast ?? 9,
      emaSlow: strategy.emaSlow ?? strategy.parameters?.emaSlow ?? 21,
      macdFast: strategy.macdFast ?? strategy.parameters?.macdFast ?? 12,
      macdSlow: strategy.macdSlow ?? strategy.parameters?.macdSlow ?? 26,
      macdSignal: strategy.macdSignal ?? strategy.parameters?.macdSignal ?? 9,
    })
    setEditStrategy(strategy)
  }

  const resetForm = () => {
    setForm({
      name: '', broker: '', timeframe: '1m',
      rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30,
      emaFast: 9, emaSlow: 21,
      macdFast: 12, macdSlow: 26, macdSignal: 9,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Strategies</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{strategies.length} strategies configured</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); setError(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Strategy
        </button>
      </div>

      {error && (
        <div className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-red-500/10 border border-red-500/30 text-sm text-red-400' : 'bg-red-50 border border-red-200 text-sm text-red-700'}`}>
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Broker</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Win Rate</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Timeframe</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`text-right px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={`px-4 py-12 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : strategies.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`px-4 py-12 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No strategies configured
                  </td>
                </tr>
              ) : (
                strategies.map((s) => (
                  <tr key={s.id} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50/50'}`}>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{s.name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.broker || '—'}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.winRate ? `${s.winRate}%` : '—'}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.timeframe || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.active ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700') : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                      }`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(s)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                          title={s.active ? 'Deactivate' : 'Activate'}
                        >
                          {s.active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="Edit Parameters"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeleteStrategy(s); setError(''); }}
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

      {/* Add Strategy Modal */}
      {showAdd && (
        <Modal title="Add Strategy" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input label="Strategy Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Input label="Broker" value={form.broker} onChange={(v) => setForm({ ...form, broker: v })} />
            <Select label="Timeframe" value={form.timeframe} onChange={(v) => setForm({ ...form, timeframe: v })} options={['1m', '5m', '15m', '30m', '1h', '4h']} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="RSI Period" type="number" value={form.rsiPeriod} onChange={(v) => setForm({ ...form, rsiPeriod: Number(v) })} />
              <Input label="RSI Overbought" type="number" value={form.rsiOverbought} onChange={(v) => setForm({ ...form, rsiOverbought: Number(v) })} />
              <Input label="RSI Oversold" type="number" value={form.rsiOversold} onChange={(v) => setForm({ ...form, rsiOversold: Number(v) })} />
              <Input label="EMA Fast" type="number" value={form.emaFast} onChange={(v) => setForm({ ...form, emaFast: Number(v) })} />
              <Input label="EMA Slow" type="number" value={form.emaSlow} onChange={(v) => setForm({ ...form, emaSlow: Number(v) })} />
              <Input label="MACD Fast" type="number" value={form.macdFast} onChange={(v) => setForm({ ...form, macdFast: Number(v) })} />
              <Input label="MACD Slow" type="number" value={form.macdSlow} onChange={(v) => setForm({ ...form, macdSlow: Number(v) })} />
              <Input label="MACD Signal" type="number" value={form.macdSignal} onChange={(v) => setForm({ ...form, macdSignal: Number(v) })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors">
                {submitting ? 'Adding...' : 'Add Strategy'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Parameters Modal */}
      {editStrategy && (
        <Modal title={`Edit Strategy — ${editStrategy.name}`} onClose={() => setEditStrategy(null)}>
          <form onSubmit={handleUpdateParams} className="space-y-4">
            <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <Input label="Strategy Name" value={params.name} onChange={(v) => setParams({ ...params, name: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Win Rate (%)" type="number" value={params.winRate} onChange={(v) => setParams({ ...params, winRate: v })} />
                <Select label="Timeframe" value={params.timeframe} onChange={(v) => setParams({ ...params, timeframe: v })} options={['1m', '5m', '15m', '30m', '1h', '4h']} />
              </div>
            </div>
            <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>RSI Parameters</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Period" type="number" value={params.rsiPeriod} onChange={(v) => setParams({ ...params, rsiPeriod: Number(v) })} />
              <Input label="Overbought" type="number" value={params.rsiOverbought} onChange={(v) => setParams({ ...params, rsiOverbought: Number(v) })} />
              <Input label="Oversold" type="number" value={params.rsiOversold} onChange={(v) => setParams({ ...params, rsiOversold: Number(v) })} />
            </div>
            <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>EMA</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Fast" type="number" value={params.emaFast} onChange={(v) => setParams({ ...params, emaFast: Number(v) })} />
              <Input label="Slow" type="number" value={params.emaSlow} onChange={(v) => setParams({ ...params, emaSlow: Number(v) })} />
            </div>
            <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>MACD</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Fast" type="number" value={params.macdFast} onChange={(v) => setParams({ ...params, macdFast: Number(v) })} />
              <Input label="Slow" type="number" value={params.macdSlow} onChange={(v) => setParams({ ...params, macdSlow: Number(v) })} />
              <Input label="Signal" type="number" value={params.macdSignal} onChange={(v) => setParams({ ...params, macdSignal: Number(v) })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditStrategy(null)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors">
                {submitting ? 'Saving...' : 'Save Parameters'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteStrategy && (
        <Modal title="Delete Strategy" onClose={() => setDeleteStrategy(null)}>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Are you sure you want to delete <strong>{deleteStrategy.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteStrategy(null)} className={`px-4 py-2 text-sm transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>Cancel</button>
            <button onClick={handleDelete} disabled={submitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors">
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
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
      <div className={`relative rounded-xl shadow-xl w-full max-w-md border max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b sticky top-0 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
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
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
