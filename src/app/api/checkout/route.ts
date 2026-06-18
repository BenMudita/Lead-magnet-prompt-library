import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export async function POST(request: Request) {
  const payload = await parseJson<{ redirect?: string }>(request, {});
  const redirect = payload.redirect?.startsWith("/") ? payload.redirect : "/promptlibrary";
  const session = await getSession();
  const redirectUrl = `/promptlibrary/signup?redirect=${encodeURIComponent(redirect)}`;

  recordAnalyticsEvent({
    eventName: "free_signup_redirected",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { source: "checkout_compat", redirect },
  });

  return NextResponse.json({
    ok: true,
    message: "The Mudita Prompt Library is free with an account. No checkout is required.",
    redirectUrl: session.accountStatus === "guest" ? redirectUrl : redirect,
  });
}
