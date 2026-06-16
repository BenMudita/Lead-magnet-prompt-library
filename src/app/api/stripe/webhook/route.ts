import Stripe from "stripe";
import { NextResponse } from "next/server";
import { appEnv, hasStripeWebhookConfig, hasSupabaseAdminConfig } from "@/lib/env";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const subscriptionStatus = (status?: string | null) =>
  status === "active" || status === "trialing" ? "active" : status === "past_due" ? "past_due" : "cancelled";

async function updateProfileFromCheckout(session: Stripe.Checkout.Session) {
  if (!hasSupabaseAdminConfig()) return;

  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) return;

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    })
    .eq("id", userId);

  if (typeof session.subscription === "string") {
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "stripe",
        provider_customer_id: typeof session.customer === "string" ? session.customer : "",
        provider_subscription_id: session.subscription,
        plan_id: "founding-member-yearly",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_subscription_id" },
    );
  }
}

async function updateSubscription(subscription: Stripe.Subscription) {
  if (!hasSupabaseAdminConfig()) return;

  const supabase = createSupabaseAdminClient();
  const status = subscriptionStatus(subscription.status);
  const customerId = typeof subscription.customer === "string" ? subscription.customer : "";
  const userId = subscription.metadata.userId;

  if (userId) {
    await supabase
      .from("profiles")
      .update({
        subscription_status: status,
        stripe_customer_id: customerId,
      })
      .eq("id", userId);
  }

  await supabase
    .from("subscriptions")
    .update({
      status,
      provider_customer_id: customerId,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: subscription.items.data[0]?.current_period_start
        ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_subscription_id", subscription.id);
}

export async function POST(request: Request) {
  if (!hasStripeWebhookConfig() || !appEnv.stripeWebhookSecret) {
    return NextResponse.json({ message: "Stripe webhook is not configured." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = createStripeClient();
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, appEnv.stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    return NextResponse.json({ message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await updateProfileFromCheckout(event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await updateSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}
