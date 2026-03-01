import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe, PLANS, type PlanKey } from '@/lib/stripe'
import { db, subscriptions, eq } from '@referkit/db'
import { getCurrentUserId } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

const CheckoutSchema = z.object({
  plan: z.enum(['starter', 'growth']),
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const { plan } = parsed.data
  const planConfig = PLANS[plan as PlanKey]

  // Look up existing Stripe customer
  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    customer: sub?.stripeCustomerId ?? undefined,
    metadata: { userId, plan },
    success_url: `${APP_URL}/settings/billing?success=true`,
    cancel_url: `${APP_URL}/settings/billing`,
  })

  return NextResponse.json({ url: session.url })
}
