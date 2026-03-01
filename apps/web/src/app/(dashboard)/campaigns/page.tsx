'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Share2, MoreVertical, Edit2, Pause, Trash2, TrendingUp, Users, CheckCircle } from 'lucide-react'

const BRAND = '#7c3bed'

const campaigns = [
  { id: 1, name: 'Summer Launch', status: 'Active', referrals: 412, conversions: 68, reward: '20% off' },
  { id: 2, name: 'Product Hunt Drop', status: 'Active', referrals: 235, conversions: 41, reward: '$10 credit' },
  { id: 3, name: 'Beta Invite', status: 'Paused', referrals: 156, conversions: 12, reward: '1 free month' },
  { id: 4, name: 'Influencer Collab', status: 'Draft', referrals: 44, conversions: 3, reward: '15% off' },
]

const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  Paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  Draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-500' },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusBadge[status] ?? statusBadge['Draft']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

function ActionsDropdown({ id }: { id: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-36 bg-gray-800 border border-white/10 rounded-lg shadow-xl py-1" onBlur={() => setOpen(false)}>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/5"><Edit2 className="w-3.5 h-3.5" />Edit</button>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/5"><Pause className="w-3.5 h-3.5" />Pause</button>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" />Delete</button>
        </div>
      )}
    </div>
  )
}

export default function CampaignsPage() {
  const [showEmpty] = useState(false)

  const stats = [
    { label: 'Active Campaigns', value: '2', icon: Share2, color: BRAND },
    { label: 'Total Referrals', value: '847', icon: Users, color: '#7c3bed' },
    { label: 'Conversions', value: '124', icon: CheckCircle, color: '#7c3bed' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Campaigns</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your referral campaigns</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: BRAND }}
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}20` }}>
              <Icon className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table or empty state */}
      {showEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border" style={{ background: `${BRAND}18`, borderColor: `${BRAND}30` }}>
            <Share2 className="w-8 h-8" style={{ color: BRAND }} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Create your first campaign</h2>
          <p className="text-sm text-gray-400 max-w-sm mb-6">Launch a referral program and reward users who bring in new signups.</p>
          <Link href="/campaigns/new" className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white" style={{ background: BRAND }}>
            <Plus className="w-4 h-4" />New Campaign
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Name', 'Status', 'Referrals', 'Conversions', 'Reward', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={c.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === campaigns.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}20` }}>
                        <Share2 className="w-3.5 h-3.5" style={{ color: BRAND }} />
                      </div>
                      <span className="text-sm font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-200">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-500" />{c.referrals}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-200">{c.conversions}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: `${BRAND}15`, color: '#a78bfa' }}>{c.reward}</span>
                  </td>
                  <td className="px-4 py-3 text-right"><ActionsDropdown id={c.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
