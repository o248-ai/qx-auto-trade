import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../AuthContext'
import { useTheme } from '../../ThemeContext'
import { useToast } from '../../components/Toast'
import { api } from '../../api'
import {
  CreditCard,
  Check,
  Zap,
  Star,
  Crown,
  Clock,
  X,
  Bitcoin,
  Smartphone,
  Landmark,
  Copy,
  ArrowRight,
} from 'lucide-react'

const plans = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: '$0',
    period: '/3 days',
    features: ['Basic strategies', '1 broker connection', 'Limited trades'],
    icon: Star,
    gradient: 'from-gray-400 to-gray-500',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$49',
    period: '/month',
    features: ['All strategies', '2 broker connections', '500 trades/mo', 'Email support'],
    icon: Zap,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/month',
    features: ['All strategies', '5 broker connections', 'Unlimited trades', 'Priority support', 'Advanced analytics'],
    icon: Zap,
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'quantum',
    name: 'Quantum',
    price: '$199',
    period: '/month',
    features: ['Everything in Pro', '10 broker connections', 'Custom strategies', 'API access', 'Dedicated support'],
    icon: Crown,
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$349',
    period: '/month',
    features: ['Everything in Quantum', 'Unlimited brokers', 'White-label access', 'Custom integrations', '24/7 support'],
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$999',
    period: '/one-time',
    features: ['Everything in Premium', 'Lifetime access', 'Free updates', 'Priority everything'],
    icon: Crown,
    gradient: 'from-emerald-500 to-teal-500',
  },
]

const paymentMethods = [
  { id: 'USDT TRC20', field: 'paymentUsdt', label: 'USDT TRC20', detailLabel: 'USDT TRC20 Address', icon: Bitcoin },
  { id: 'UPI', field: 'paymentUpi', label: 'UPI', detailLabel: 'UPI ID / Number', icon: Smartphone },
  { id: 'Bank Transfer', field: 'paymentBank', label: 'Bank Transfer', detailLabel: 'Bank Account Details', icon: Landmark },
]

const priceConfigKeys = { basic: 'priceBasic', pro: 'pricePro', quantum: 'priceQuantum', premium: 'pricePremium', lifetime: 'priceLifetime' }

function getPlanPrice(plan, siteConfig) {
  const key = priceConfigKeys[plan.id]
  if (key && siteConfig && siteConfig[key]) {
    const val = siteConfig[key]
    return val.toString().startsWith('$') ? val : `$${val}`
  }
  return plan.price
}

function StatusBadge({ status }) {
  const s = String(status || 'PENDING').toUpperCase()
  const styles =
    s === 'APPROVED'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : s === 'REJECTED'
        ? 'bg-red-500/10 text-red-500 border-red-500/20'
        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s}
    </span>
  )
}

export default function Subscriptions() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'
  const userId = user?.id

  const [activePlan, setActivePlan] = useState(null)
  const [subExpiresAt, setSubExpiresAt] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [siteConfig, setSiteConfig] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [methodId, setMethodId] = useState(paymentMethods[0].id)
  const [txId, setTxId] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [lifetimeForm, setLifetimeForm] = useState({ referralUid: '', depositAmount: '' })
  const [lifetimeLoading, setLifetimeLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      const [subData, cfgData] = await Promise.all([
        api.getUserSubscriptions(userId),
        api.getUserSiteConfig().catch(() => null),
      ])
      setActivePlan(subData.activePlan || user?.subscriptionPlan || 'Free Trial')
      setSubExpiresAt(subData.subExpiresAt || user?.subExpiresAt || null)
      setHistory(subData.history || [])
      if (cfgData?.siteConfig) setSiteConfig(cfgData.siteConfig)
    } catch {} finally { setLoading(false) }
  }, [userId, user?.subscriptionPlan, user?.subExpiresAt])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handleVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [fetchData])

  const isCurrentPlan = (plan) =>
    activePlan === plan.name || String(activePlan || '').toLowerCase() === plan.name.toLowerCase()

  const openPaymentModal = (plan) => {
    setSelectedPlan(plan)
    setMethodId(paymentMethods[0].id)
    setTxId('')
    setProofUrl('')
  }

  const closePaymentModal = () => setSelectedPlan(null)

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      toast('Copied to clipboard', 'info')
    } catch {
      toast('Failed to copy', 'error')
    }
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    try {
      await api.subscribePlan({
        userId,
        userEmail: user?.email,
        userName: user?.name,
        planName: selectedPlan.name,
        price: getPlanPrice(selectedPlan, siteConfig),
        paymentMethod: methodId,
        paymentTxId: txId,
        paymentProof: proofUrl,
      })
      toast('Payment submitted! Please wait for admin approval.', 'success')
      closePaymentModal()
      fetchData()
    } catch (err) {
      toast(err.message || 'Payment submission failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLifetimeRequest = async (e) => {
    e.preventDefault()
    setLifetimeLoading(true)
    try {
      await api.lifetimeRequest({
        userId,
        userEmail: user?.email,
        userName: user?.name,
        referralUid: lifetimeForm.referralUid,
        depositAmount: lifetimeForm.depositAmount,
      })
      toast('Lifetime access request submitted! Please wait for admin approval.', 'success')
      setLifetimeForm({ referralUid: '', depositAmount: '' })
      fetchData()
    } catch (err) {
      toast(err.message || 'Request failed', 'error')
    } finally {
      setLifetimeLoading(false)
    }
  }

  const activeMethod = paymentMethods.find((m) => m.id === methodId)
  const activeDetail = siteConfig ? siteConfig[activeMethod.field] : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Subscription</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage your plan and billing</p>
      </div>

      {/* Current Plan Card */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Plan</p>
            <h2 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{activePlan || 'Free Trial'}</h2>
            {subExpiresAt && (
              <p className={`text-sm mt-1 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-3.5 h-3.5" />
                Expires {new Date(subExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const current = isCurrentPlan(plan)
          return (
            <div key={plan.id} className={`rounded-2xl border p-6 flex flex-col transition-all ${
              current
                ? `ring-2 ring-blue-500 ${isDark ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-500'}`
                : isDark ? 'bg-gray-800 border-gray-700/50 hover:border-gray-600 hover:shadow-lg' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                  <plan.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{plan.name}</h3>
              </div>
              <div className="mb-5">
                <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{getPlanPrice(plan, siteConfig)}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              {current ? (
                <span className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  Current Plan
                </span>
              ) : (
                <button
                  onClick={() => openPaymentModal(plan)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 inline-flex items-center justify-center gap-2"
                >
                  Subscribe <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Subscription History */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Subscription History</h2>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-10">
            <CreditCard className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No subscription history yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/50' : 'border-b border-gray-100'}>
                  {['Plan', 'Amount', 'Date', 'Status', 'Approval Details'].map((h) => (
                    <th key={h} className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'Amount' ? 'text-right' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((sub, i) => (
                  <tr key={sub.id || i} className={`border-b last:border-0 ${isDark ? 'border-gray-700/30 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                    <td className={`px-6 py-3.5 font-semibold whitespace-nowrap ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{sub.planName || sub.plan || '—'}</td>
                    <td className={`px-6 py-3.5 text-right font-semibold whitespace-nowrap ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{sub.price || sub.amount || '—'}</td>
                    <td className={`px-6 py-3.5 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={sub.status} /></td>
                    <td className={`px-6 py-3.5 max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="line-clamp-2">{sub.notes || sub.approvalDetails || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lifetime Access Section */}
      <div id="lifetime-section" className={`rounded-2xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <h2 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Lifetime Access</h2>
        </div>
        <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Unlock permanent access to the entire program with a one-time referral deposit. Refer our platform using your unique
          referral link, make the qualifying deposit, and submit your details below — our team will verify your referral UID and
          activate Lifetime Access on your account within 24 hours.
        </p>
        <form onSubmit={handleLifetimeRequest} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Referral Link / UID</label>
            <input
              type="text"
              required
              value={lifetimeForm.referralUid}
              onChange={(e) => setLifetimeForm((p) => ({ ...p, referralUid: e.target.value }))}
              placeholder="https://ref.link/your-id or REF-XXXX"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Deposit Amount ($)</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={lifetimeForm.depositAmount}
              onChange={(e) => setLifetimeForm((p) => ({ ...p, depositAmount: e.target.value }))}
              placeholder="100"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={lifetimeLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {lifetimeLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closePaymentModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <div className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br ${selectedPlan.gradient} flex items-center justify-center shadow-lg`}>
                  <selectedPlan.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{selectedPlan.name} Plan</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getPlanPrice(selectedPlan, siteConfig)}<span>{selectedPlan.period}</span></p>
                </div>
              </div>
              <button
                onClick={closePaymentModal}
                className={`p-1.5 rounded-lg ml-2 shrink-0 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((m) => {
                      const selected = m.id === methodId
                      const detail = siteConfig ? siteConfig[m.field] : null
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={!detail}
                          title={!detail ? 'Not configured' : m.label}
                          onClick={() => setMethodId(m.id)}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-semibold transition-all ${
                            selected
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500'
                              : isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          } ${!detail ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <m.icon className="w-4.5 h-4.5" />{m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {activeDetail ? (
                  <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activeMethod.detailLabel}</p>
                        <p className={`text-sm font-medium break-all ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{activeDetail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeDetail)}
                        className={`p-2 rounded-lg shrink-0 ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-500">This payment method has not been configured by the admin yet.</p>
                )}

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Transaction ID / UPI Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="Enter your transaction reference..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Payment Screenshot URL <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Paste screenshot link..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              <div className={`px-6 py-4 border-b-0 rounded-b-2xl border-t ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : `Submit Payment · ${selectedPlan.price}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
