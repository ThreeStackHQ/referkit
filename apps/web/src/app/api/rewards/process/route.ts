export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, rewardJobs, conversions, campaigns, users, referrers } from "@referkit/db";
import { eq, and, lt, inArray } from "@referkit/db";
import { getStripe } from "@/lib/stripe";

const MAX_JOBS = 10;
const MAX_ATTEMPTS = 3;

type RewardJobPayload = {
  campaignId: string;
  campaignName: string;
  rewardValue: string;
  rewardWebhookUrl: string | null;
  referrerEmail: string;
  convertedEmail: string;
  conversionId: string;
};

async function hmacSignature(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Buffer.from(sig).toString("hex");
}

async function processStripeCoupon(
  payload: RewardJobPayload
): Promise<void> {
  const stripe = getStripe();

  // Create a 100% off one-time coupon
  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "once",
    name: `ReferKit: ${payload.campaignName}`,
    max_redemptions: 1,
  });

  // Look up user by referrer email to get stripe_customer_id
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.email, payload.referrerEmail))
    .limit(1);

  if (user?.stripeCustomerId) {
    // Apply coupon to customer
    await stripe.customers.update(user.stripeCustomerId, {
      coupon: coupon.id,
    });
  }

  // Store coupon id on conversion
  await db
    .update(conversions)
    .set({ stripeCouponId: coupon.id })
    .where(eq(conversions.id, payload.conversionId));
}

async function processWebhook(
  payload: RewardJobPayload,
  webhookUrl: string
): Promise<void> {
  const secret = process.env.REWARD_WEBHOOK_SECRET ?? "";
  const body = JSON.stringify({
    conversion_id: payload.conversionId,
    referrer_email: payload.referrerEmail,
    converted_email: payload.convertedEmail,
    reward_value: payload.rewardValue,
  });

  const signature = await hmacSignature(secret, body);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ReferKit-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Webhook returned ${res.status}: ${await res.text()}`);
  }
}

export async function POST(req: Request) {
  try {
    // Verify internal call (optional CRON_SECRET)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fetch pending/failed jobs with attempts < MAX_ATTEMPTS
    const jobs = await db
      .select()
      .from(rewardJobs)
      .where(
        and(
          inArray(rewardJobs.status, ["pending", "failed"]),
          lt(rewardJobs.attempts, MAX_ATTEMPTS)
        )
      )
      .limit(MAX_JOBS);

    if (jobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No jobs to process" });
    }

    // Mark all as processing
    await db
      .update(rewardJobs)
      .set({ status: "processing" })
      .where(
        inArray(
          rewardJobs.id,
          jobs.map((j) => j.id)
        )
      );

    let successCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      const payload = job.payload as RewardJobPayload;

      try {
        if (job.rewardType === "stripe_coupon") {
          await processStripeCoupon(payload);
        } else if (
          job.rewardType === "custom_webhook" ||
          job.rewardType === "credits"
        ) {
          const webhookUrl = payload.rewardWebhookUrl ?? payload.rewardValue;
          if (!webhookUrl) throw new Error("No webhook URL configured");
          await processWebhook(payload, webhookUrl);
        }

        // Success
        await db
          .update(rewardJobs)
          .set({ status: "done", attempts: job.attempts + 1 })
          .where(eq(rewardJobs.id, job.id));

        await db
          .update(conversions)
          .set({ rewardStatus: "sent" })
          .where(eq(conversions.id, job.conversionId));

        successCount++;
      } catch (err) {
        const newAttempts = job.attempts + 1;
        const newStatus = newAttempts >= MAX_ATTEMPTS ? "failed" : "pending";
        const lastError = err instanceof Error ? err.message : String(err);

        await db
          .update(rewardJobs)
          .set({
            status: newStatus,
            attempts: newAttempts,
            lastError,
          })
          .where(eq(rewardJobs.id, job.id));

        if (newStatus === "failed") {
          await db
            .update(conversions)
            .set({ rewardStatus: "failed" })
            .where(eq(conversions.id, job.conversionId));
        } else {
          // Reset to pending for retry
          await db
            .update(conversions)
            .set({ rewardStatus: "pending" })
            .where(eq(conversions.id, job.conversionId));
        }

        failCount++;
      }
    }

    return NextResponse.json({
      processed: jobs.length,
      success: successCount,
      failed: failCount,
    });
  } catch (err) {
    console.error("[rewards/process]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
