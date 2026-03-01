import { db, users, subscriptions } from "@referkit/db";
import { eq } from "@referkit/db";

export type Tier = "free" | "pro";

export async function getUserTier(userId: string): Promise<Tier> {
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return "free";

  // Also check subscription status for pro
  if (user.plan === "pro") {
    const [sub] = await db
      .select({ status: subscriptions.status, currentPeriodEnd: subscriptions.currentPeriodEnd })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (sub && sub.status === "active" && sub.currentPeriodEnd > new Date()) {
      return "pro";
    }
    return "free";
  }

  return "free";
}

export function maxCampaigns(tier: Tier): number {
  return tier === "pro" ? Infinity : 1;
}
