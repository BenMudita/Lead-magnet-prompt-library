import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { getSession, setSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_CHECKOUT !== "true") {
    return NextResponse.json(
      {
        message:
          "Demo checkout is disabled in production. Wire Stripe Checkout and webhooks before enabling paid access.",
      },
      { status: 501 },
    );
  }

  const payload = await parseJson<{ redirect?: string }>(request, {});
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
    properties: { provider: "demo", redirect: payload.redirect },
  });
  recordAnalyticsEvent({
    eventName: "purchase_completed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { provider: "demo", planId: "founding-member-49" },
  });

  return NextResponse.json({ ok: true, redirect: payload.redirect ?? "/promptlibrary" });
}
