'use client'

import { useState } from 'react'
import { Copy, Check, Send, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

const BRAND = '#7c3aed'

// ─── Mock delivery log data ────────────────────────────────────────────────
type LogStatus = 'success' | 'client_error' | 'server_error'

interface DeliveryLog {
  id: number
  status: LogStatus
  code: number
  eventType: string
  endpoint: string
  responseTime: number
  timestamp: string
}

const mockLogs: DeliveryLog[] = [
  { id: 1,  status: 'success',      code: 200, eventType: 'referral.created',       endpoint: 'https://hooks.example.com/referkit', responseTime: 124,  timestamp: '2026-03-01 14:31:02' },
  { id: 2,  status: 'success',      code: 200, eventType: 'conversion.attributed',   endpoint: 'https://hooks.example.com/referkit', responseTime: 98,   timestamp: '2026-03-01 14:28:47' },
  { id: 3,  status: 'client_error', code: 404, eventType: 'reward.issued',           endpoint: 'https://hooks.example.com/referkit', responseTime: 203,  timestamp: '2026-03-01 14:15:19' },
  { id: 4,  status: 'success',      code: 200, eventType: 'link.clicked',            endpoint: 'https://hooks.example.com/referkit', responseTime: 87,   timestamp: '2026-03-01 14:10:55' },
  { id: 5,  status: 'server_error', code: 500, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 5001, timestamp: '2026-03-01 13:58:33' },
  { id: 6,  status: 'success',      code: 200, eventType: 'conversion.attributed',   endpoint: 'https://hooks.example.com/referkit', responseTime: 110,  timestamp: '2026-03-01 13:44:12' },
  { id: 7,  status: 'success',      code: 200, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 134,  timestamp: '2026-03-01 13:30:01' },
  { id: 8,  status: 'client_error', code: 401, eventType: 'reward.issued',           endpoint: 'https://hooks.example.com/referkit', responseTime: 88,   timestamp: '2026-03-01 13:22:45' },
  { id: 9,  status: 'success',      code: 200, eventType: 'link.clicked',            endpoint: 'https://hooks.example.com/referkit', responseTime: 76,   timestamp: '2026-03-01 13:10:08' },
  { id: 10, status: 'success',      code: 200, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 102,  timestamp: '2026-03-01 12:59:22' },
  { id: 11, status: 'server_error', code: 503, eventType: 'conversion.attributed',   endpoint: 'https://hooks.example.com/referkit', responseTime: 10002,timestamp: '2026-03-01 12:45:37' },
  { id: 12, status: 'success',      code: 200, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 91,   timestamp: '2026-03-01 12:32:14' },
  { id: 13, status: 'success',      code: 200, eventType: 'link.clicked',            endpoint: 'https://hooks.example.com/referkit', responseTime: 118,  timestamp: '2026-03-01 12:18:53' },
  { id: 14, status: 'client_error', code: 422, eventType: 'reward.issued',           endpoint: 'https://hooks.example.com/referkit', responseTime: 95,   timestamp: '2026-03-01 12:05:40' },
  { id: 15, status: 'success',      code: 200, eventType: 'conversion.attributed',   endpoint: 'https://hooks.example.com/referkit', responseTime: 83,   timestamp: '2026-03-01 11:50:29' },
  { id: 16, status: 'success',      code: 200, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 129,  timestamp: '2026-03-01 11:38:05' },
  { id: 17, status: 'success',      code: 200, eventType: 'link.clicked',            endpoint: 'https://hooks.example.com/referkit', responseTime: 74,   timestamp: '2026-03-01 11:22:14' },
  { id: 18, status: 'server_error', code: 502, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 8003, timestamp: '2026-03-01 11:09:58' },
  { id: 19, status: 'success',      code: 200, eventType: 'conversion.attributed',   endpoint: 'https://hooks.example.com/referkit', responseTime: 107,  timestamp: '2026-03-01 10:55:31' },
  { id: 20, status: 'success',      code: 200, eventType: 'referral.created',        endpoint: 'https://hooks.example.com/referkit', responseTime: 96,   timestamp: '2026-03-01 10:40:17' },
]

const SAMPLE_PAYLOAD = JSON.stringify({
  id: 'evt_01HZ3K2ABCDE',
  event: 'referral.created',
  created_at: '2026-03-01T14:31:02Z',
  data: {
    referral_id: 'ref_9xB2mQW',
    campaign_id: 'cmp_SummerLaunch',
    referrer_id: 'usr_7tPqNz',
    referral_link: 'https://app.referkit.io/r/abc123',
    status: 'pending',
    metadata: { source: 'organic', device: 'desktop' },
  },
}, null, 2)

// ─── Sub-components ────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function StatusBadge({ status, code }: { status: LogStatus; code: number }) {
  const map = {
    success:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    client_error: { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
    server_error: { bg: 'bg-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {code} {status === 'success' ? 'OK' : 'ERR'}
    </span>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const events = [
  { id: 'referral.created',      label: 'referral.created',       desc: 'Fired when a new referral link is used' },
  { id: 'conversion.attributed', label: 'conversion.attributed',  desc: 'Fired when a referred user converts' },
  { id: 'reward.issued',         label: 'reward.issued',          desc: 'Fired when a reward is issued to a referrer' },
  { id: 'link.clicked',          label: 'link.clicked',           desc: 'Fired on every unique referral link click' },
]

export default function WebhooksPage() {
  const [endpointUrl, setEndpointUrl] = useState('https://hooks.example.com/referkit')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['referral.created', 'conversion.attributed']))
  const [saved, setSaved] = useState(false)

  const [testState, setTestState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [retrying, setRetrying] = useState<number | null>(null)
  const [logs, setLogs] = useState<DeliveryLog[]>(mockLogs)

  const MASKED_SECRET = 'wh_live_••••••••••••••••••••••••'
  const REAL_SECRET   = 'wh_live_d8f3a1c2b9e4f750a1c2b9e4'

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleEvent = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleTest = () => {
    setTestState('loading')
    setTimeout(() => {
      setTestState(Math.random() > 0.2 ? 'success' : 'error')
    }, 1400)
  }

  const handleRetry = (id: number) => {
    setRetrying(id)
    setTimeout(() => {
      setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'success', code: 200, responseTime: 112 } : l))
      setRetrying(null)
    }, 1200)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Webhooks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Receive real-time HTTP callbacks when referral events occur.</p>
      </div>

      {/* ── Section 1: Webhook Configuration ───────────────────────────── */}
      <section className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Webhook Configuration</h2>

        {/* Endpoint URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-300">Endpoint URL</label>
          <input
            type="url"
            value={endpointUrl}
            onChange={e => setEndpointUrl(e.target.value)}
            placeholder="https://your-app.com/webhooks/referkit"
            className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition"
          />
          <p className="text-[11px] text-gray-500">Must be a publicly accessible HTTPS URL.</p>
        </div>

        {/* Webhook Secret */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-300">Webhook Secret</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-800/60 border border-white/10 rounded-md text-sm text-gray-400 font-mono select-none">
              {MASKED_SECRET}
            </div>
            <CopyButton value={REAL_SECRET} />
          </div>
          <p className="text-[11px] text-gray-500">Use this to verify webhook signatures via <code className="text-violet-400">X-ReferKit-Signature</code>.</p>
        </div>

        {/* Event Subscriptions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">Event Subscriptions</label>
          <div className="space-y-2">
            {events.map(ev => (
              <label key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02] cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={selectedEvents.has(ev.id)}
                  onChange={() => toggleEvent(ev.id)}
                  className="mt-0.5 w-4 h-4 rounded accent-violet-600 cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-xs font-mono font-medium text-gray-200">{ev.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{ev.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: BRAND }}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* ── Section 2: Test Webhook ─────────────────────────────────────── */}
      <section className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Test Webhook</h2>
          <p className="text-xs text-gray-400 mt-0.5">Send a sample <code className="text-violet-400">referral.created</code> event to your endpoint.</p>
        </div>

        <button
          onClick={handleTest}
          disabled={testState === 'loading'}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: BRAND }}
        >
          {testState === 'loading'
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
            : <><Send className="w-4 h-4" /> Send Test Webhook</>}
        </button>

        {/* State feedback */}
        {testState === 'success' && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Webhook delivered successfully — 200 OK in 112ms
          </div>
        )}
        {testState === 'error' && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            Delivery failed — endpoint returned 500. Check your server logs.
          </div>
        )}

        {/* Sample payload */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Sample payload</span>
            <CopyButton value={SAMPLE_PAYLOAD} />
          </div>
          <pre className="bg-gray-950/80 border border-white/[0.06] rounded-lg p-4 text-xs text-gray-300 font-mono overflow-x-auto leading-relaxed">
            {SAMPLE_PAYLOAD}
          </pre>
        </div>
      </section>

      {/* ── Section 3: Delivery Log ─────────────────────────────────────── */}
      <section className="bg-gray-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Delivery Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 20 webhook attempts</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Success</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Failed</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10">
              <tr className="border-b border-white/[0.07]">
                {['Status', 'Event', 'Endpoint', 'Response Time', 'Timestamp', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === logs.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={log.status} code={log.code} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-200">{log.eventType}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <span className="text-xs text-gray-400 truncate block" title={log.endpoint}>
                      {log.endpoint.replace('https://', '').substring(0, 30)}…
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Clock className="w-3 h-3 text-gray-600" />
                      {log.responseTime >= 1000
                        ? `${(log.responseTime / 1000).toFixed(1)}s`
                        : `${log.responseTime}ms`}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {log.status !== 'success' && (
                      <button
                        onClick={() => handleRetry(log.id)}
                        disabled={retrying === log.id}
                        className="flex items-center gap-1.5 ml-auto px-2.5 py-1.5 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${retrying === log.id ? 'animate-spin' : ''}`} />
                        {retrying === log.id ? 'Retrying…' : 'Retry'}
                      </button>
                    )}
                    {log.status === 'success' && (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Log legend */}
        <div className="px-6 py-3 border-t border-white/[0.07] flex items-center gap-2 text-xs text-gray-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed deliveries are automatically retried up to 5 times with exponential backoff.
        </div>
      </section>
    </div>
  )
}
