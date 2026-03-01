export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db, subscriptions } from "@referkit/db";
import { eq } from "@referkit/db";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as "starter" | "growth" | undefined;
        if (!userId || !plan) break;

        const subscriptionId = session.subscription as string;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        // In Stripe v20+, current_period_end is on SubscriptionItem
        const periodEndTs = sub.items.data[0]?.current_period_end ?? 0;
        const periodEnd = periodEndTs > 0 ? new Date(periodEndTs * 1000) : null;

        await db
          .insert(subscriptions)
          .values({
            userId,
            tier: plan,
            status: sub.status,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            currentPeriodEnd: periodEnd,
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              tier: plan,
              status: sub.status,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              currentPeriodEnd: periodEnd,
            },
          });

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const periodEndTs = sub.items.data[0]?.current_period_end ?? 0;
        const periodEnd = periodEndTs > 0 ? new Date(periodEndTs * 1000) : null;

        await db
          .update(subscriptions)
          .set({
            status: sub.status,
            currentPeriodEnd: periodEnd,
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        // Downgrade if cancelled/past_due/unpaid
        if (["canceled", "unpaid", "past_due"].includes(sub.status)) {
          await db
            .update(subscriptions)
            .set({ tier: "free" })
            .where(eq(subscriptions.stripeCustomerId, customerId));
        }

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const periodEndTs = sub.items.data[0]?.current_period_end ?? 0;
        const periodEnd = periodEndTs > 0 ? new Date(periodEndTs * 1000) : null;

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            tier: "free",
            currentPeriodEnd: periodEnd,
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db
          .update(subscriptions)
          .set({ status: "past_due" })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
