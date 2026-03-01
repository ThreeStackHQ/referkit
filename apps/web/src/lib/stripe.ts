import Stripe from 'stripe'

let _stripe: Stripe | null = null

/** Lazy singleton — only instantiated on first use (not at module load time) */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    name: 'Starter',
    price: 9,
  },
  growth: {
    priceId: process.env.STRIPE_PRICE_GROWTH ?? '',
    name: 'Growth',
    price: 29,
  },
} as const

export type PlanKey = keyof typeof PLANS
