'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Twitter, Facebook, Linkedin, Share2, Info } from 'lucide-react'

const BRAND = '#7c3bed'

const inputCls = 'w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500/60 transition-colors'
const labelCls = 'block text-xs font-medium text-gray-300 mb-1.5'

export default function NewCampaignPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rewardType, setRewardType] = useState('percentage')
  const [rewardValue, setRewardValue] = useState('')
  const [maxReferrals, setMaxReferrals] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [landingUrl, setLandingUrl] = useState('')
  const [shareMessage, setShareMessage] = useState('Hey! Join {{referral_link}} and get a discount when you sign up through my link.')
  const [copied, setCopied] = useState(false)

  const previewName = name || 'Your Campaign'
  const previewReward = rewardValue ? (rewardType === 'percentage' ? `${rewardValue}% off` : rewardType === 'fixed' ? `$${rewardValue} credit` : '1 free month') : '20% off'
  const previewLink = 'https://ref.kit/abc123'

  function handleCopy() {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/campaigns" className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Create Campaign</h1>
          <p className="text-sm text-gray-400 mt-0.5">Set up a new referral program</p>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left: Form */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Campaign Info */}
          <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-1">Campaign Info</h2>
            <div>
              <label className={labelCls}>Campaign Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Summer Launch 2024" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="What is this campaign about?" />
            </div>
          </div>

          {/* Reward */}
          <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-1">Reward</h2>
            <div>
              <label className={labelCls}>Reward Type</label>
              <select value={rewardType} onChange={e => setRewardType(e.target.value)} className={inputCls}>
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Credit</option>
                <option value="free_month">Free Month</option>
              </select>
            </div>
            {rewardType !== 'free_month' && (
              <div>
                <label className={labelCls}>{rewardType === 'percentage' ? 'Discount %' : 'Credit Amount ($)'}</label>
                <input value={rewardValue} onChange={e => setRewardValue(e.target.value)} type="number" min="1" className={inputCls} placeholder={rewardType === 'percentage' ? '20' : '10'} />
              </div>
            )}
            <div>
              <label className={labelCls}>Max Referrals per User</label>
              <input value={maxReferrals} onChange={e => setMaxReferrals(e.target.value)} type="number" min="1" className={inputCls} placeholder="Unlimited" />
            </div>
          </div>

          {/* Duration */}
          <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-1">Campaign Duration</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Date</label>
                <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input value={endDate} onChange={e => setEndDate(e.target.value)} type="date" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-1">Distribution</h2>
            <div>
              <label className={labelCls}>Landing Page URL</label>
              <input value={landingUrl} onChange={e => setLandingUrl(e.target.value)} className={inputCls} placeholder="https://yourapp.com/refer" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}>Social Share Message</label>
                <span className="text-[11px] text-gray-500 flex items-center gap-1"><Info className="w-3 h-3" />Use {'{{referral_link}}'}</span>
              </div>
              <textarea value={shareMessage} onChange={e => setShareMessage(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-80 flex-shrink-0 sticky top-6">
          <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Live Widget Preview</h2>
            {/* Referral card preview */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${BRAND}40`, background: 'linear-gradient(135deg, #1a0533 0%, #0f0a1f 100%)' }}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BRAND }}>
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{previewName}</p>
                    <p className="text-[11px] text-gray-400">Referral Program</p>
                  </div>
                </div>
                <div className="rounded-lg p-3 mb-3" style={{ background: `${BRAND}18` }}>
                  <p className="text-xs text-gray-300 mb-0.5">Your reward</p>
                  <p className="text-lg font-bold" style={{ color: '#a78bfa' }}>{previewReward}</p>
                  <p className="text-[11px] text-gray-400">for each successful referral</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">Your referral link:</p>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-gray-950/50 px-3 py-2 mb-3">
                  <span className="flex-1 text-[11px] text-gray-300 truncate font-mono">{previewLink}</span>
                  <button onClick={handleCopy} className="flex-shrink-0 text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: copied ? '#10b981' : '#a78bfa' }}>
                    <Copy className="w-3 h-3" />{copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">Share:</span>
                  {[Twitter, Facebook, Linkedin].map((Icon, i) => (
                    <button key={i} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#a78bfa' }}>
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 text-center mt-3">Preview updates as you type</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between py-4 border-t border-white/[0.07]">
        <Link href="/campaigns" className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-gray-200 transition-colors">
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
            Save Draft
          </button>
          <button className="px-5 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: BRAND }}>
            Publish Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
