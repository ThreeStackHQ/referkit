'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard,
  CheckCircle,
  X,
  Download,
  Zap,
  Shield,
  Globe,
  Code2,
  Users,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const BRAND = '#7c3bed'

// ─── Mock data ────────────────────────────────────────────────────────────────

const CURRENT_PLAN = {
  name: 'Starter',
  price: 9,
  renewal: 'Apr 1, 2026',
}

const USAGE = [
  { label: 'Referrers', used: 43, limit: Infinity, display: 'unlimited' },
  { label: 'Campaigns', used: 2, limit: 3, display: '3' },
  { label: 'Conversions', used: 78, limit: 100, display: '100' },
] as const

const HISTORY = [
  { date: 'Mar 1, 2026', amount: '$9.00', status: 'Paid' },
  { date: 'Feb 1, 2026', amount: '$9.00', status: 'Paid' },
  { date: 'Jan 1, 2026', amount: '$9.00', status: 'Paid' },
]

const GROWTH_FEATURES = [
  { icon: BarChart3, label: 'Unlimited campaigns' },
  { icon: Users, label: 'Unlimited conversions' },
  { icon: Globe, label: 'Custom domain' },
  { icon: Shield, label: 'Fraud detection' },
  { icon: Zap, label: 'White-label portal' },
  { icon: Code2, label: 'API access' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsageBar({
  used,
  limit,
  label,
  display,
}: {
  used: number
  limit: number
  label: string
  display: string
}) {
  const pct = limit === Infinity ? 100 : Math.min(100, (used / limit) * 100)
  const nearLimit = limit !== Infinity && pct >= 80
  const barColor = nearLimit ? '#f97316' : BRAND

  return (
    <div className="bg-gray-900 border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-sm text-gray-400">
          <span className={cn('font-semibold', nearLimit ? 'text-orange-400' : 'text-white')}>
            {used}
          </span>
          <span className="text-gray-600 mx-1">/</span>
          <span>{display}</span>
        </p>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {nearLimit && (
        <p className="mt-2 text-xs text-orange-400">
          Approaching limit — consider upgrading
        </p>
      )}
    </div>
  )
}

function PlanCard({
  name,
  price,
  isCurrent,
  badge,
  features,
  onUpgrade,
  loading,
}: {
  name: string
  price: number
  isCurrent: boolean
  badge?: string
  features: string[]
  onUpgrade?: () => void
  loading?: boolean
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-6 transition-all',
        isCurrent
          ? 'border-violet-500/60 bg-violet-500/5'
          : 'border-white/[0.07] bg-gray-900'
      )}
    >
      {badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold text-white"
          style={{ background: BRAND }}
        >
          {badge}
        </span>
      )}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-400">{name}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-white">${price}</span>
          <span className="text-sm text-gray-500">/mo</span>
        </div>
      </div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
            {f}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <span className="w-full text-center py-2 rounded-lg text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
          Current plan
        </span>
      ) : (
        <button
          onClick={onUpgrade}
          disabled={loading}
          className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: BRAND }}
        >
          {loading ? 'Redirecting…' : 'Upgrade to Growth'}
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function BillingContent() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [managingBilling, setManagingBilling] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
    }
  }, [searchParams])

  const handleManageBilling = useCallback(async () => {
    setManagingBilling(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch {
      // silently fail
    } finally {
      setManagingBilling(false)
    }
  }, [])

  const handleUpgrade = useCallback(async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'growth' }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
    } catch {
      // silently fail
    } finally {
      setUpgrading(false)
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Success Banner */}
      {showSuccess && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
          style={{ background: `${BRAND}18`, borderColor: `${BRAND}50`, color: '#c4b5fd' }}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-violet-400" />
          <span className="flex-1">
            Subscription activated! Your plan has been updated.
          </span>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-violet-400 hover:text-violet-200"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Billing &amp; Subscription</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your plan, usage, and payment details.
        </p>
      </div>

      {/* Current Plan Card */}
      <div
        className="rounded-xl border bg-gray-900 p-6"
        style={{ borderLeftWidth: 4, borderLeftColor: BRAND, borderColor: `${BRAND}60` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
              Current Plan
            </p>
            <p className="text-2xl font-bold text-white">{CURRENT_PLAN.name}</p>
            <p className="mt-0.5 text-sm text-gray-400">
              ${CURRENT_PLAN.price}/month · Renews {CURRENT_PLAN.renewal}
            </p>
          </div>
          <CreditCard className="w-8 h-8 text-violet-400 mt-1" />
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button
            onClick={handleManageBilling}
            disabled={managingBilling}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {managingBilling ? 'Opening…' : 'Manage Billing'}
          </button>
          <button className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancel Plan
          </button>
        </div>
      </div>

      {/* Usage */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Usage This Month
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {USAGE.map((u) => (
            <UsageBar key={u.label} {...u} />
          ))}
        </div>
      </section>

      {/* Upgrade Section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">
          Unlock more with Growth Plan
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Scale without limits — custom domains, fraud detection &amp; API access.
        </p>

        {/* Growth features teaser */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {GROWTH_FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-gray-900 border border-white/[0.07] rounded-lg px-3 py-2.5"
            >
              <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span className="text-xs text-gray-300">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanCard
            name="Starter"
            price={9}
            isCurrent
            features={[
              'Unlimited referrers',
              '3 campaigns',
              '100 conversions/mo',
              'Basic analytics',
            ]}
          />
          <PlanCard
            name="Growth"
            price={29}
            isCurrent={false}
            badge="Most Popular"
            features={[
              'Unlimited campaigns',
              'Unlimited conversions',
              'Custom domain',
              'Fraud detection',
              'White-label portal',
              'API access',
            ]}
            onUpgrade={handleUpgrade}
            loading={upgrading}
          />
        </div>
      </section>

      {/* Billing History */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Billing History
        </h2>
        <div className="rounded-xl border border-white/[0.07] bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {HISTORY.map((row) => (
                <tr key={row.date} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-gray-300">{row.date}</td>
                  <td className="px-5 py-3.5 text-gray-300 font-medium">
                    {row.amount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment Method */}
      <section>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          Payment Method
        </h2>
        <div className="rounded-xl border border-white/[0.07] bg-gray-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gray-800 rounded-md flex items-center justify-center border border-white/10">
              <CreditCard className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">
                Mastercard •••• 8888
              </p>
              <p className="text-xs text-gray-500">Expires 09/2026</p>
            </div>
          </div>
          <button
            onClick={handleManageBilling}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Update
          </button>
        </div>
      </section>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  )
}
