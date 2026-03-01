import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { db, subscriptions, eq } from '@referkit/db'

export const dynamic = 'force-dynamic'

function deriveTier(
  priceId: string | undefined
): 'free' | 'starter' | 'growth' {
  if (!priceId) return 'free'
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 'growth'
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter'
  return 'free'
}

/** In Stripe SDK v20, current_period_end lives on the SubscriptionItem */
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const periodEndSec = sub.items.data[0]?.current_period_end
  return periodEndSec ? new Date(periodEndSec * 1000) : null
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

async function upsertSubscription(params: {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  tier: 'free' | 'starter' | 'growth'
  status: string
  currentPeriodEnd: Date | null
}): Promise<void> {
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, params.userId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set({
        tier: params.tier,
        status: params.status,
        stripeCustomerId: params.stripeCustomerId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        currentPeriodEnd: params.currentPeriodEnd,
      })
      .where(eq(subscriptions.userId, params.userId))
  } else {
    await db.insert(subscriptions).values({
      userId: params.userId,
      tier: params.tier,
      status: params.status,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      currentPeriodEnd: params.currentPeriodEnd,
    })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId || !session.subscription || !session.customer) break

        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as Stripe.Subscription).id

        const customerId = getCustomerId(session.customer)
        if (!customerId) break

        const sub = await getStripe().subscriptions.retrieve(subId)
        const priceId = sub.items.data[0]?.price.id
        const tier = deriveTier(priceId)

        await upsertSubscription({
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subId,
          tier,
          status: sub.status,
          currentPeriodEnd: getPeriodEnd(sub),
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = getCustomerId(sub.customer)
        if (!customerId) break

        const priceId = sub.items.data[0]?.price.id
        const tier = deriveTier(priceId)

        await db
          .update(subscriptions)
          .set({
            tier,
            status: sub.status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: getPeriodEnd(sub),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await db
          .update(subscriptions)
          .set({ tier: 'free', status: 'canceled', currentPeriodEnd: null })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
