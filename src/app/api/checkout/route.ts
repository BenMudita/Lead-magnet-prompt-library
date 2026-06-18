import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { appEnv, absoluteAppUrl, isStripePaymentsEnabled } from "@/lib/env";
import { getSession, setSession } from "@/lib/session";
import { createStripeClient } from "@/lib/stripe";
import { recordAnalyticsEvent } from "@/lib/store";

export async function POST(request: Request) {
  const stripePaymentsEnabled = isStripePaymentsEnabled();

  if (process.env.NODE_ENV === "production" && !stripePaymentsEnabled && !appEnv.enableDemoCheckout) {
    return NextResponse.json(
      {
        message:
          "Demo checkout is disabled in production. Wire Stripe Checkout and webhooks before enabling paid access.",
      },
      { status: 501 },
    );
  }

  const payload = await parseJson<{ redirect?: string }>(request, {});
  const redirect = payload.redirect?.startsWith("/") ? payload.redirect : "/promptlibrary";

  if (stripePaymentsEnabled) {
    const session = await getSession();
    if (!session.userId || !session.email) {
      const signupUrl = new URL("/promptlibrary/signup", absoluteAppUrl(request.url));
      signupUrl.searchParams.set("redirect", `/promptlibrary/pricing?redirect=${encodeURIComponent(redirect)}`);
      return NextResponse.json(
        {
          message: "Create a free account before starting checkout.",
          redirectUrl: signupUrl.pathname + signupUrl.search,
        },
        { status: 401 },
      );
    }

    const stripe = createStripeClient();
    const successUrl = new URL(redirect, absoluteAppUrl(request.url));
    successUrl.searchParams.set("checkout", "success");
    const cancelUrl = new URL("/promptlibrary/pricing", absoluteAppUrl(request.url));
    cancelUrl.searchParams.set("redirect", redirect);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.email,
      client_reference_id: session.userId,
      line_items: [
        {
          price: appEnv.stripeFoundingMemberPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        userId: session.userId,
        email: session.email,
      },
      subscription_data: {
        metadata: {
          userId: session.userId,
        },
      },
    });

    recordAnalyticsEvent({
      eventName: "checkout_started",
      anonymousId: session.anonymousId,
      userId: session.userId,
      properties: { provider: "stripe", redirect },
    });

    return NextResponse.json({ ok: true, redirectUrl: checkoutSession.url });
  }

  const before = await getSession();
  await setSession({
    accountStatus: "pro",
    role: before.role === "visitor" ? "member" : before.role,
    email: before.email ?? "member@muditastudios.com",
  });
  const session = await getSession();

  recordAnalyticsEvent({
    eventName: "checkout_started",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { provider: "demo", redirect },
  });
  recordAnalyticsEvent({
    eventName: "purchase_completed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { provider: "demo", planId: "founding-member-49" },
  });

  return NextResponse.json({ ok: true, redirect });
}
