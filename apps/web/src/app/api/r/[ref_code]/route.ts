export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, referrers, campaigns } from "@referkit/db";
import { eq } from "@referkit/db";
import { sql } from "@referkit/db";

export async function GET(
  _req: Request,
  { params }: { params: { ref_code: string } }
) {
  try {
    const refCode = params.ref_code;

    const [referrer] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.refCode, refCode))
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral link" }, { status: 404 });
    }

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, referrer.campaignId))
      .limit(1);

    if (!campaign || campaign.status !== "active") {
      return NextResponse.json({ error: "Campaign not active" }, { status: 404 });
    }

    // Increment click count (fire and forget)
    await db
      .update(referrers)
      .set({ totalClicks: sql`${referrers.totalClicks} + 1` })
      .where(eq(referrers.id, referrer.id));

    // Build redirect URL
    const targetUrl = new URL(campaign.campaignUrl);
    targetUrl.searchParams.set("ref", refCode);

    const response = NextResponse.redirect(targetUrl.toString(), 302);

    // Set cookie for conversion tracking (7 days)
    response.cookies.set("rk_ref", refCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: false, // accessible by JS for conversion tracking
    });

    return response;
  } catch (err) {
    console.error("[r/[ref_code]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
