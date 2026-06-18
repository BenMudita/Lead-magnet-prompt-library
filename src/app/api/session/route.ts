import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { recordEmailSignupRequest } from "@/lib/email-signups";
import { absoluteAppUrl, isSupabaseAuthEnabled } from "@/lib/env";
import { clearSession, getSession, setSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAnalyticsEvent } from "@/lib/store";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isLikelyEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const safeInternalPath = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/promptlibrary";

export async function GET() {
  return NextResponse.json(await getSession());
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    if (form.get("_method") === "delete") {
      await clearSession();
      return NextResponse.redirect(new URL("/promptlibrary", request.url));
    }
  }

  const payload = await parseJson<{ email?: string; redirectTo?: string }>(request, {});
  const email = normalizeEmail(payload.email ?? "member@muditastudios.com");

  if (!isLikelyEmail(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  if (isSupabaseAuthEnabled()) {
    const redirectTo = safeInternalPath(payload.redirectTo);
    const callbackUrl = new URL("/auth/callback", absoluteAppUrl(request.url));
    callbackUrl.searchParams.set("redirectTo", redirectTo);

    try {
      await recordEmailSignupRequest({
        email,
        redirectTo,
        source: "prompt_library_signup",
      });
    } catch (error) {
      console.error("Failed to save email signup", error);
      return NextResponse.json(
        { message: "We could not save that email. Please try again." },
        { status: 500 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const session = await getSession();
    recordAnalyticsEvent({
      eventName: "login_magic_link_requested",
      anonymousId: session.anonymousId,
      userId: session.userId,
      properties: { provider: "supabase", email },
    });

    return NextResponse.json({
      ok: true,
      pendingConfirmation: true,
      message: `Check ${email} for a sign-in link.`,
    });
  }

  const accountStatus = "free";
  await setSession({ accountStatus, role: "member", email });
  const session = await getSession();

  recordAnalyticsEvent({
    eventName: "signup_completed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { accountStatus, role: session.role, email },
  });

  return NextResponse.json(session);
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
