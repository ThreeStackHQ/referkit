'use client'

import { useState } from 'react'
import { Trophy, Users, DollarSign, Clock, Search, ChevronDown } from 'lucide-react'

const BRAND = '#7c3bed'

const podium = [
  { rank: 1, name: 'Sarah Chen', handle: 'sarah@acme.com', referrals: 87, reward: '$174.00', color: '#f59e0b', emoji: '🥇' },
  { rank: 2, name: 'Marco Rossi', handle: 'marco@startup.io', referrals: 64, reward: '$128.00', color: '#9ca3af', emoji: '🥈' },
  { rank: 3, name: 'Priya Patel', handle: 'priya@design.co', referrals: 51, reward: '$102.00', color: '#b45309', emoji: '🥉' },
]

const leaderboard = [
  { rank: 1, name: 'Sarah Chen', email: 'sarah@acme.com', campaign: 'Summer Launch', referrals: 87, status: 'Paid', reward: '$174.00', joined: 'Jan 5, 2024' },
  { rank: 2, name: 'Marco Rossi', email: 'marco@startup.io', campaign: 'Product Hunt Drop', referrals: 64, status: 'Paid', reward: '$128.00', joined: 'Jan 8, 2024' },
  { rank: 3, name: 'Priya Patel', email: 'priya@design.co', campaign: 'Summer Launch', referrals: 51, status: 'Pending', reward: '$102.00', joined: 'Jan 12, 2024' },
  { rank: 4, name: 'Jordan Kim', email: 'jordan@apps.dev', campaign: 'Beta Invite', referrals: 38, status: 'Pending', reward: '$76.00', joined: 'Jan 15, 2024' },
  { rank: 5, name: 'Emily Torres', email: 'emily@shop.com', campaign: 'Summer Launch', referrals: 29, status: 'Paid', reward: '$58.00', joined: 'Jan 18, 2024' },
  { rank: 6, name: 'Liam Johnson', email: 'liam@biz.co', campaign: 'Product Hunt Drop', referrals: 24, status: 'Pending', reward: '$48.00', joined: 'Jan 20, 2024' },
  { rank: 7, name: 'Aisha Malik', email: 'aisha@co.io', campaign: 'Beta Invite', referrals: 19, status: 'Paid', reward: '$38.00', joined: 'Jan 22, 2024' },
  { rank: 8, name: 'Noah Smith', email: 'noah@email.com', campaign: 'Summer Launch', referrals: 15, status: 'Pending', reward: '$30.00', joined: 'Jan 25, 2024' },
]

const campaigns = ['All Campaigns', 'Summer Launch', 'Product Hunt Drop', 'Beta Invite', 'Influencer Collab']

export default function ReferrersPage() {
  const [search, setSearch] = useState('')
  const [campaign, setCampaign] = useState('All Campaigns')

  const filtered = leaderboard.filter(r =>
    (campaign === 'All Campaigns' || r.campaign === campaign) &&
    (search === '' || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Referrer Leaderboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Top referrers across all campaigns</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Referrers', value: '89', icon: Users },
          { label: 'Pending Rewards', value: '$340', icon: Clock },
          { label: 'Paid Out', value: '$2,100', icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
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

      {/* Podium */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <h2 className="text-sm font-semibold text-white">Top Performers</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {podium.map(({ rank, name, handle, referrals, reward, color, emoji }) => (
            <div key={rank} className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
              <div className="text-3xl mb-2">{emoji}</div>
              <p className="text-sm font-semibold text-white mb-0.5">{name}</p>
              <p className="text-[11px] text-gray-500 mb-3">{handle}</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{referrals}</p>
                  <p className="text-[10px] text-gray-500">referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#a78bfa' }}>{reward}</p>
                  <p className="text-[10px] text-gray-500">earned</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Search referrers…" />
        </div>
        <div className="relative">
          <select value={campaign} onChange={e => setCampaign(e.target.value)} className="appearance-none bg-gray-900 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-violet-500">
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {['Rank', 'Referrer', 'Campaign', 'Referrals', 'Status', 'Reward', 'Joined'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.rank} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold" style={{ color: r.rank <= 3 ? ['#f59e0b', '#9ca3af', '#b45309'][r.rank - 1] : '#6b7280' }}>
                    #{r.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{r.campaign}</td>
                <td className="px-4 py-3 text-sm font-medium text-white">{r.referrals}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'Paid' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#a78bfa' }}>{r.reward}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.joined}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No referrers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
