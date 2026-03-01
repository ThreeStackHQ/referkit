export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, campaigns, referrers, conversions } from "@referkit/db";
import { eq, sql, count } from "@referkit/db";
import { getUserTier, maxCampaigns } from "@/lib/tier";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rewardType: z.enum(["stripe_coupon", "credits", "custom_webhook"]),
  rewardValue: z.string().min(1, "Reward value is required"),
  triggerEvent: z.string().optional(),
  campaignUrl: z.string().url("Campaign URL must be a valid URL"),
});

// GET /api/campaigns — list user's campaigns with stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rows = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        rewardType: campaigns.rewardType,
        rewardValue: campaigns.rewardValue,
        triggerEvent: campaigns.triggerEvent,
        campaignUrl: campaigns.campaignUrl,
        createdAt: campaigns.createdAt,
        totalReferrers: sql<number>`cast(count(distinct ${referrers.id}) as int)`,
        totalConversions: sql<number>`cast(count(distinct ${conversions.id}) as int)`,
      })
      .from(campaigns)
      .leftJoin(referrers, eq(referrers.campaignId, campaigns.id))
      .leftJoin(conversions, eq(conversions.campaignId, campaigns.id))
      .where(eq(campaigns.userId, userId))
      .groupBy(campaigns.id);

    const result = rows.map((r) => ({
      ...r,
      conversionRate:
        r.totalReferrers > 0
          ? ((r.totalConversions / r.totalReferrers) * 100).toFixed(1) + "%"
          : "0%",
    }));

    return NextResponse.json({ campaigns: result });
  } catch (err) {
    console.error("[campaigns:GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/campaigns — create campaign
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check tier limits
    const tier = await getUserTier(userId);
    const limit = maxCampaigns(tier);

    if (limit !== Infinity) {
      const [{ value: existing }] = await db
        .select({ value: count() })
        .from(campaigns)
        .where(eq(campaigns.userId, userId));

      if (Number(existing) >= limit) {
        return NextResponse.json(
          {
            error: `Free plan is limited to ${limit} campaign(s). Upgrade to Pro for unlimited.`,
          },
          { status: 403 }
        );
      }
    }

    const [campaign] = await db
      .insert(campaigns)
      .values({ userId, ...parsed.data })
      .returning();

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error("[campaigns:POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
