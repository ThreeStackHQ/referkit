'use client'

import Link from 'next/link'
import { Share2, Zap, Gift, BarChart2, Code, Layout, CreditCard, Check, X, Star, ArrowRight, Twitter, Github } from 'lucide-react'

const BRAND = '#7c3bed'

const features = [
  { icon: Zap, title: 'Easy Setup', desc: 'Embed a referral widget in minutes with one line of code. No backend required.' },
  { icon: Gift, title: 'Custom Rewards', desc: 'Offer percentage discounts, fixed credits, or free months — your choice.' },
  { icon: BarChart2, title: 'Analytics', desc: 'Real-time dashboards showing referrals, conversions, and revenue impact.' },
  { icon: Code, title: 'Embeddable Widget', desc: 'Drop our prebuilt widget anywhere — React, Vue, plain HTML.' },
  { icon: Layout, title: 'Multi-Campaign', desc: 'Run multiple campaigns simultaneously for different products or segments.' },
  { icon: CreditCard, title: 'Stripe Integration', desc: 'Automatically apply discounts and track revenue through Stripe webhooks.' },
]

const comparison = [
  { feature: 'Free tier', referKit: true, rock: false, custom: false },
  { feature: 'Embeddable widget', referKit: true, rock: true, custom: false },
  { feature: 'Custom reward types', referKit: true, rock: true, custom: true },
  { feature: 'Multi-campaign', referKit: true, rock: true, custom: true },
  { feature: 'Stripe integration', referKit: true, rock: false, custom: true },
  { feature: 'White-label', referKit: true, rock: false, custom: true },
  { feature: 'API access', referKit: true, rock: true, custom: true },
  { feature: 'Setup time', referKit: '5 min', rock: '2 hrs', custom: 'Weeks' },
]

const pricing = [
  {
    name: 'Free', price: '$0', period: '', features: ['1 campaign', 'Up to 100 referrals/mo', 'Basic analytics', 'Embeddable widget', 'Email support'], cta: 'Get started free', highlight: false,
  },
  {
    name: 'Pro', price: '$12', period: '/mo', features: ['Unlimited campaigns', 'Unlimited referrals', 'Advanced analytics', 'Custom reward types', 'Stripe integration', 'Priority support'], cta: 'Start Pro trial', highlight: true,
  },
  {
    name: 'Growth', price: '$29', period: '/mo', features: ['Everything in Pro', 'White-label widget', 'Custom domain', 'API access', 'Webhook events', 'Dedicated support'], cta: 'Start Growth trial', highlight: false,
  },
]

const testimonials = [
  { name: 'Alex Rivera', role: 'Founder, Launchpad', avatar: 'AR', text: 'ReferKit helped us grow 3x in 60 days. Setup took 15 minutes and our referral rate jumped from 2% to 18%.' },
  { name: 'Jamie Park', role: 'CTO, Loopify', avatar: 'JP', text: "We tried building referral tracking ourselves. Wasted 3 weeks. ReferKit gave us more features in an afternoon." },
  { name: 'Sam Nguyen', role: 'Growth Lead, Taskr', avatar: 'SN', text: 'The Stripe integration is seamless. Discounts apply automatically and we can see exactly which campaigns drive revenue.' },
]

function CheckMark({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <span className="text-xs text-gray-300">{val}</span>
  return val
    ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
    : <X className="w-4 h-4 text-gray-600 mx-auto" />
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-white/[0.07] bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: BRAND }}>
              <Share2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">ReferKit</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#compare" className="hover:text-white transition-colors">Compare</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/campaigns" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">Log in</Link>
            <Link href="/campaigns" className="text-sm font-medium px-4 py-1.5 rounded-md text-white transition-opacity hover:opacity-90" style={{ background: BRAND }}>Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${BRAND}, transparent 70%)` }} />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-6 border" style={{ background: `${BRAND}15`, borderColor: `${BRAND}40`, color: '#a78bfa' }}>
            <Zap className="w-3 h-3" /> Now with Stripe integration
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Launch viral referral<br /><span style={{ color: '#a78bfa' }}>programs in minutes</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Embed a customizable referral widget, set up rewards, and watch your users bring in new signups — zero backend required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/campaigns" className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: BRAND }}>
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-colors">
              See Demo
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4">No credit card required · 1 campaign free forever</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything you need to grow</h2>
          <p className="text-gray-400">Powerful referral mechanics without the engineering overhead.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${BRAND}20` }}>
                <Icon className="w-5 h-5" style={{ color: BRAND }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">How we compare</h2>
          <p className="text-gray-400">Spoiler: we're better and cheaper.</p>
        </div>
        <div className="bg-gray-900/60 border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Feature</th>
                <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: '#a78bfa' }}>ReferKit</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">Referral Rock</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">Custom build</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={row.feature} className={`border-b border-white/[0.04] ${i === comparison.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-5 py-3 text-sm text-gray-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center"><CheckMark val={row.referKit} /></td>
                  <td className="px-4 py-3 text-center"><CheckMark val={row.rock} /></td>
                  <td className="px-4 py-3 text-center"><CheckMark val={row.custom} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Simple pricing</h2>
          <p className="text-gray-400">Start free. Scale when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pricing.map(({ name, price, period, features: feats, cta, highlight }) => (
            <div key={name} className={`relative rounded-xl p-6 border flex flex-col ${highlight ? 'border-violet-500/50' : 'border-white/[0.07] bg-gray-900/60'}`}
              style={highlight ? { background: `linear-gradient(135deg, ${BRAND}18, #0f0a1f)`, boxShadow: `0 0 40px ${BRAND}20` } : {}}>
              {highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: BRAND }}>Most Popular</div>}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white mb-1">{name}</h3>
                <div className="flex items-end gap-0.5">
                  <span className="text-3xl font-extrabold text-white">{price}</span>
                  <span className="text-gray-400 text-sm mb-1">{period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {feats.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: highlight ? '#a78bfa' : '#10b981' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/campaigns" className={`block text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${highlight ? 'text-white hover:opacity-90' : 'text-gray-300 border border-white/10 hover:border-white/20 hover:text-white'}`}
                style={highlight ? { background: BRAND } : {}}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Loved by indie makers</h2>
          <p className="text-gray-400">Join hundreds of SaaS founders growing with ReferKit.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(({ name, role, avatar, text }) => (
            <div key={name} className="bg-gray-900/60 border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">"{text}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, #5b21b6)` }}>{avatar}</div>
                <div>
                  <p className="text-xs font-semibold text-white">{name}</p>
                  <p className="text-[11px] text-gray-500">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-2xl p-10 border" style={{ background: `linear-gradient(135deg, ${BRAND}25, #0f0a1f)`, borderColor: `${BRAND}40` }}>
          <h2 className="text-3xl font-bold text-white mb-3">Ready to launch your referral program?</h2>
          <p className="text-gray-400 mb-6">Start in minutes. 1 campaign free forever.</p>
          <Link href="/campaigns" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: BRAND }}>
            Start Free Today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: BRAND }}>
              <Share2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">ReferKit</span>
          </div>
          <p className="text-xs text-gray-600">© 2024 ThreeStack · ReferKit · All rights reserved</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors"><Github className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
