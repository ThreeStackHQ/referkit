import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db, subscriptions, eq } from '@referkit/db'
import { getCurrentUserId } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(): Promise<NextResponse> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No billing account found' },
      { status: 404 }
    )
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
