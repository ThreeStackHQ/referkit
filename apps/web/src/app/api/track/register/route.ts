export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { db, campaigns, referrers } from "@referkit/db";
import { eq, and } from "@referkit/db";
import { nanoid } from "nanoid";

const registerSchema = z.object({
  campaign_id: z.string().uuid(),
  user_email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { campaign_id, user_email } = parsed.data;

    // Check campaign exists and is active
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaign_id), eq(campaigns.status, "active")))
      .limit(1);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or not active" },
        { status: 404 }
      );
    }

    // Return existing referrer if already registered
    const [existing] = await db
      .select()
      .from(referrers)
      .where(
        and(
          eq(referrers.campaignId, campaign_id),
          eq(referrers.userEmail, user_email.toLowerCase())
        )
      )
      .limit(1);

    if (existing) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      return NextResponse.json({
        ref_code: existing.refCode,
        referral_link: `${appUrl}/r/${existing.refCode}`,
      });
    }

    // Generate unique ref_code (retry on collision)
    let refCode: string;
    let attempts = 0;
    do {
      refCode = nanoid(8);
      const [collision] = await db
        .select({ id: referrers.id })
        .from(referrers)
        .where(eq(referrers.refCode, refCode))
        .limit(1);
      if (!collision) break;
      attempts++;
    } while (attempts < 5);

    const [referrer] = await db
      .insert(referrers)
      .values({
        campaignId: campaign_id,
        userEmail: user_email.toLowerCase(),
        refCode: refCode!,
      })
      .returning();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json(
      {
        ref_code: referrer.refCode,
        referral_link: `${appUrl}/r/${referrer.refCode}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[track/register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
