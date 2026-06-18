import { NextResponse } from "next/server";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { markEmailSignupConfirmed, updateEmailSignupCrmSync } from "@/lib/email-signups";
import { absoluteAppUrl } from "@/lib/env";
import { ensureSupabaseProfile } from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncTwentyLead } from "@/lib/twenty";

const emailOtpTypes = new Set(["signup", "invite", "magiclink", "recovery", "email", "email_change"]);

const safeInternalPath = (value: string | null) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/promptlibrary";

const isEmailOtpType = (value: string | null): value is EmailOtpType =>
  Boolean(value && emailOtpTypes.has(value));

async function completeSupabaseAuth(requestUrl: URL) {
  const supabase = await createSupabaseServerClient();
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.user;
  }

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (tokenHash && isEmailOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) throw error;
    return data.user;
  }

  return null;
}

async function syncConfirmedUser(user: User | null) {
  if (!user) return;

  await ensureSupabaseProfile(user);

  if (user.email) {
    const signup = await markEmailSignupConfirmed({
      email: user.email,
      userId: user.id,
      source: "prompt_library_signup",
    });

    try {
      const crmResult = await syncTwentyLead({
        email: user.email,
        userId: user.id,
        status: "confirmed",
        source: signup?.source ?? "prompt_library_signup",
        redirectTo: signup?.redirectTo,
        signupUrl: signup?.signupUrl,
        referrer: signup?.referrer,
        utmSource: signup?.utmSource,
        utmMedium: signup?.utmMedium,
        utmCampaign: signup?.utmCampaign,
        promptSlug: signup?.promptSlug,
        existingContactId: signup?.crmContactId,
      });

      if (crmResult.synced || crmResult.error) {
        await updateEmailSignupCrmSync({
          email: user.email,
          provider: crmResult.provider,
          contactId: crmResult.contactId,
          error: crmResult.error,
        });
      }
    } catch (error) {
      console.error("Failed to sync confirmed Twenty lead", error);
    }
  }
}

export async function handleSupabaseAuthCallback(request: Request) {
  const requestUrl = new URL(request.url);
  const safeRedirect = safeInternalPath(requestUrl.searchParams.get("redirectTo"));

  try {
    const user = await completeSupabaseAuth(requestUrl);
    await syncConfirmedUser(user);
  } catch (error) {
    console.error("Supabase auth callback failed", error);
  }

  return NextResponse.redirect(new URL(safeRedirect, absoluteAppUrl(request.url)));
}
