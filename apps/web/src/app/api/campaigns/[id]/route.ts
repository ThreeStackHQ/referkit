export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, campaigns, referrers, conversions } from "@referkit/db";
import { eq, and, desc } from "@referkit/db";

type Params = { params: { id: string } };

async function getOwnedCampaign(campaignId: string, userId: string) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);
  return campaign ?? null;
}

// GET /api/campaigns/[id]
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await getOwnedCampaign(params.id, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const [campaignReferrers, recentConversions] = await Promise.all([
      db.select().from(referrers).where(eq(referrers.campaignId, params.id)),
      db
        .select()
        .from(conversions)
        .where(eq(conversions.campaignId, params.id))
        .orderBy(desc(conversions.createdAt))
        .limit(20),
    ]);

    return NextResponse.json({ campaign, referrers: campaignReferrers, recentConversions });
  } catch (err) {
    console.error("[campaigns/[id]:GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  rewardType: z.enum(["stripe_coupon", "credits", "custom_webhook"]).optional(),
  rewardValue: z.string().min(1).optional(),
  campaignUrl: z.string().url().optional(),
});

// PATCH /api/campaigns/[id]
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await getOwnedCampaign(params.id, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(campaigns)
      .set(parsed.data)
      .where(eq(campaigns.id, params.id))
      .returning();

    return NextResponse.json({ campaign: updated });
  } catch (err) {
    console.error("[campaigns/[id]:PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] — soft delete (set status=paused)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await getOwnedCampaign(params.id, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await db
      .update(campaigns)
      .set({ status: "paused" })
      .where(eq(campaigns.id, params.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[campaigns/[id]:DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
