export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db, users, subscriptions } from "@referkit/db";
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
        if (!userId) break;

        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        // Upsert subscription
        const existing = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(subscriptions)
            .set({
              stripeSubscriptionId: subscriptionId,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            })
            .where(eq(subscriptions.userId, userId));
        } else {
          await db.insert(subscriptions).values({
            userId,
            stripeSubscriptionId: subscriptionId,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          });
        }

        // Upgrade user plan
        await db
          .update(users)
          .set({ plan: "pro" })
          .where(eq(users.id, userId));

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (!user) break;

        await db
          .update(subscriptions)
          .set({
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          })
          .where(eq(subscriptions.userId, user.id));

        // Downgrade if cancelled/past_due/unpaid
        if (["canceled", "unpaid", "past_due"].includes(sub.status)) {
          await db
            .update(users)
            .set({ plan: "free" })
            .where(eq(users.id, user.id));
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (!user) break;

        await db
          .update(subscriptions)
          .set({ status: "past_due" })
          .where(eq(subscriptions.userId, user.id));

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
