import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { recordEmailSignupRequest, updateEmailSignupCrmSync } from "@/lib/email-signups";
import { absoluteAppUrl, isSupabaseAuthEnabled } from "@/lib/env";
import { clearSession, getSession, setSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAnalyticsEvent } from "@/lib/store";
import { syncTwentyLead } from "@/lib/twenty";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isLikelyEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const safeInternalPath = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/promptlibrary";
const safeText = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 500) : undefined;
};

const promptSlugFromRedirect = (redirectTo: string) => {
  const match = redirectTo.match(/^\/promptlibrary\/p\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const safeSignupUrl = ({
  value,
  fallbackPath,
  requestUrl,
}: {
  value?: string;
  fallbackPath: string;
  requestUrl: string;
}) => {
  const appOrigin = absoluteAppUrl(requestUrl);

  if (value) {
    try {
      const url = new URL(value);
      if (url.origin === appOrigin) {
        return url.toString();
      }
    } catch {
      // Fall through to a server-generated URL.
    }
  }

  return new URL(`/promptlibrary/signup?redirect=${encodeURIComponent(fallbackPath)}`, appOrigin).toString();
};

type SessionPayload = {
  email?: string;
  redirectTo?: string;
  signupUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

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

  const payload = await parseJson<SessionPayload>(request, {});
  const email = normalizeEmail(payload.email ?? "member@muditastudios.com");

  if (!isLikelyEmail(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  if (isSupabaseAuthEnabled()) {
    const redirectTo = safeInternalPath(payload.redirectTo);
    const signupUrl = safeSignupUrl({ value: payload.signupUrl, fallbackPath: redirectTo, requestUrl: request.url });
    const leadContext = {
      signupUrl,
      referrer: safeText(payload.referrer),
      utmSource: safeText(payload.utmSource),
      utmMedium: safeText(payload.utmMedium),
      utmCampaign: safeText(payload.utmCampaign),
      promptSlug: promptSlugFromRedirect(redirectTo),
    };
    const callbackUrl = new URL("/auth/callback", absoluteAppUrl(request.url));
    callbackUrl.searchParams.set("redirectTo", redirectTo);

    let signupRecord;
    try {
      signupRecord = await recordEmailSignupRequest({
        email,
        redirectTo,
        source: "prompt_library_signup",
        ...leadContext,
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

    try {
      const crmResult = await syncTwentyLead({
        email,
        status: "magic_link_requested",
        redirectTo,
        source: "prompt_library_signup",
        existingContactId: signupRecord?.crmContactId,
        ...leadContext,
      });

      if (crmResult.synced || crmResult.error) {
        await updateEmailSignupCrmSync({
          email,
          provider: crmResult.provider,
          contactId: crmResult.contactId,
          error: crmResult.error,
        });
      }
    } catch (error) {
      console.error("Failed to sync Twenty lead", error);
    }

    const session = await getSession();
    recordAnalyticsEvent({
      eventName: "login_magic_link_requested",
      anonymousId: session.anonymousId,
      userId: session.userId,
      properties: { provider: "supabase", email, signupUrl, promptSlug: leadContext.promptSlug },
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
