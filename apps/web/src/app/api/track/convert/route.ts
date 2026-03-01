export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { db, campaigns, referrers, conversions, rewardJobs } from "@referkit/db";
import { eq, and } from "@referkit/db";
import { sql } from "@referkit/db";

const convertSchema = z.object({
  campaign_id: z.string().uuid(),
  converted_email: z.string().email(),
  ref_code: z.string().length(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = convertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { campaign_id, converted_email, ref_code } = parsed.data;

    // Look up referrer by ref_code
    const [referrer] = await db
      .select()
      .from(referrers)
      .where(
        and(
          eq(referrers.refCode, ref_code),
          eq(referrers.campaignId, campaign_id)
        )
      )
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
    }

    // Lookup campaign
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaign_id))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Idempotency: check if already converted
    const [existing] = await db
      .select()
      .from(conversions)
      .where(
        and(
          eq(conversions.campaignId, campaign_id),
          eq(conversions.convertedEmail, converted_email.toLowerCase())
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ conversion_id: existing.id });
    }

    // Create conversion record
    const [conversion] = await db
      .insert(conversions)
      .values({
        campaignId: campaign_id,
        referrerId: referrer.id,
        convertedEmail: converted_email.toLowerCase(),
      })
      .returning();

    // Increment referrer stats
    await db
      .update(referrers)
      .set({
        totalSignups: sql`${referrers.totalSignups} + 1`,
        totalConversions: sql`${referrers.totalConversions} + 1`,
      })
      .where(eq(referrers.id, referrer.id));

    // Enqueue reward job
    await db.insert(rewardJobs).values({
      conversionId: conversion.id,
      rewardType: campaign.rewardType,
      payload: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        rewardValue: campaign.rewardValue,
        rewardWebhookUrl:
          campaign.rewardType !== "stripe_coupon" ? campaign.rewardValue : null,
        referrerEmail: referrer.userEmail,
        convertedEmail: converted_email.toLowerCase(),
        conversionId: conversion.id,
      },
    });

    return NextResponse.json({ conversion_id: conversion.id }, { status: 201 });
  } catch (err) {
    console.error("[track/convert]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
