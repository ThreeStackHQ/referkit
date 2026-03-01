export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, referrers, rewardJobs, conversions } from "@referkit/db";
import { eq, and } from "@referkit/db";
import { count } from "@referkit/db";

export async function GET(
  _req: Request,
  { params }: { params: { ref_code: string } }
) {
  try {
    const [referrer] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.refCode, params.ref_code))
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
    }

    // Count pending rewards (via conversions → reward_jobs)
    const [{ pendingRewards }] = await db
      .select({ pendingRewards: count() })
      .from(rewardJobs)
      .innerJoin(conversions, eq(conversions.id, rewardJobs.conversionId))
      .where(
        and(
          eq(conversions.referrerId, referrer.id),
          eq(rewardJobs.status, "pending")
        )
      );

    return NextResponse.json({
      total_clicks: referrer.totalClicks,
      total_signups: referrer.totalSignups,
      total_conversions: referrer.totalConversions,
      pending_rewards: Number(pendingRewards),
    });
  } catch (err) {
    console.error("[referrers/[ref_code]/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
