import { db, subscriptions, eq } from '@referkit/db'

export type Tier = 'free' | 'starter' | 'growth'

export interface TierLimits {
  referrers: number
  campaigns: number
  conversions: number
}

export async function getUserTier(userId: string): Promise<Tier> {
  const [sub] = await db
    .select({ tier: subscriptions.tier, status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (!sub || sub.status !== 'active') return 'free'
  if (sub.tier === 'growth') return 'growth'
  if (sub.tier === 'starter') return 'starter'
  return 'free'
}

export function getTierLimits(tier: string): TierLimits {
  if (tier === 'growth') {
    return { referrers: Infinity, campaigns: Infinity, conversions: Infinity }
  }
  if (tier === 'starter') {
    return { referrers: Infinity, campaigns: 3, conversions: 100 }
  }
  return { referrers: 50, campaigns: 1, conversions: 10 }
}
