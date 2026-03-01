import { db, subscriptions, campaigns, referrers } from "@referkit/db";
import { eq, count } from "@referkit/db";

export type Tier = "free" | "starter" | "growth";

const TIER_LIMITS = {
  free: {
    campaignLimit: 1,
    referrerLimit: 50,
    conversionsPerMonth: 10,
  },
  starter: {
    campaignLimit: 3,
    referrerLimit: Infinity,
    conversionsPerMonth: 100,
  },
  growth: {
    campaignLimit: Infinity,
    referrerLimit: Infinity,
    conversionsPerMonth: Infinity,
  },
} as const;

/**
 * Get the current tier for a user
 */
export async function getUserTier(userId: string): Promise<Tier> {
  const [sub] = await db
    .select({
      tier: subscriptions.tier,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) return "free";

  const isActive =
    sub.status === "active" &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());

  if (!isActive) return "free";

  return (sub.tier as Tier) ?? "free";
}

/**
 * Check if user can create another campaign
 */
export async function canCreateCampaign(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const tier = await getUserTier(userId);
  const limit = TIER_LIMITS[tier].campaignLimit;

  if (limit === Infinity) return { allowed: true };

  const [row] = await db
    .select({ total: count() })
    .from(campaigns)
    .where(eq(campaigns.userId, userId));

  const current = row?.total ?? 0;

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Your ${tier} plan allows up to ${limit} campaign(s). Upgrade to create more.`,
    };
  }

  return { allowed: true };
}

/**
 * Get referrer limit for a tier (-1 means unlimited)
 */
export function getReferrerLimit(tier: Tier): number {
  const limit = TIER_LIMITS[tier].referrerLimit;
  return limit === Infinity ? -1 : limit;
}

/**
 * Check if a campaign can accept another referrer
 */
export async function canAddReferrer(
  userId: string,
  campaignId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const tier = await getUserTier(userId);
  const limit = TIER_LIMITS[tier].referrerLimit;

  if (limit === Infinity) return { allowed: true };

  const [row] = await db
    .select({ total: count() })
    .from(referrers)
    .where(eq(referrers.campaignId, campaignId));

  const current = row?.total ?? 0;

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Your ${tier} plan allows up to ${limit} referrer(s). Upgrade to add more.`,
    };
  }

  return { allowed: true };
}

// Legacy helper for backwards compatibility
export function maxCampaigns(tier: Tier): number {
  const limit = TIER_LIMITS[tier].campaignLimit;
  return limit === Infinity ? Infinity : limit;
}
