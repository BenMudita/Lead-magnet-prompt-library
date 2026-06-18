import { isSupabaseDatabaseEnabled } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type EmailSignupStatus = "magic_link_requested" | "confirmed";

type EmailSignupOptions = {
  email: string;
  source?: string;
  redirectTo?: string;
  signupUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  promptSlug?: string;
  userId?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const table = "email_signups";

export type EmailSignupRecord = {
  email: string;
  source?: string;
  redirectTo?: string;
  signupUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  promptSlug?: string;
  userId?: string;
  crmContactId?: string;
};

const signupSelect = [
  "email",
  "source",
  "redirect_to",
  "signup_url",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "prompt_slug",
  "user_id",
  "request_count",
  "crm_contact_id",
].join(",");

type EmailSignupRow = {
  email: string;
  source: string | null;
  redirect_to: string | null;
  signup_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  prompt_slug: string | null;
  user_id: string | null;
  request_count: number | null;
  crm_contact_id: string | null;
};

const toRecord = (row: EmailSignupRow): EmailSignupRecord => ({
  email: row.email,
  source: row.source ?? undefined,
  redirectTo: row.redirect_to ?? undefined,
  signupUrl: row.signup_url ?? undefined,
  referrer: row.referrer ?? undefined,
  utmSource: row.utm_source ?? undefined,
  utmMedium: row.utm_medium ?? undefined,
  utmCampaign: row.utm_campaign ?? undefined,
  promptSlug: row.prompt_slug ?? undefined,
  userId: row.user_id ?? undefined,
  crmContactId: row.crm_contact_id ?? undefined,
});

const assignIfDefined = (patch: Record<string, unknown>, key: string, value: unknown) => {
  if (value !== undefined) {
    patch[key] = value;
  }
};

async function upsertEmailSignup({
  email,
  source,
  redirectTo,
  signupUrl,
  referrer,
  utmSource,
  utmMedium,
  utmCampaign,
  promptSlug,
  userId,
  status,
}: EmailSignupOptions & { status: EmailSignupStatus }): Promise<EmailSignupRecord | null> {
  if (!isSupabaseDatabaseEnabled()) return null;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: existing, error: readError } = await supabase
    .from(table)
    .select(signupSelect)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (readError) throw readError;

  const existingRow = existing as EmailSignupRow | null;

  if (existingRow) {
    const patch: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    assignIfDefined(patch, "source", source);
    assignIfDefined(patch, "redirect_to", redirectTo);
    assignIfDefined(patch, "signup_url", signupUrl);
    assignIfDefined(patch, "referrer", referrer);
    assignIfDefined(patch, "utm_source", utmSource);
    assignIfDefined(patch, "utm_medium", utmMedium);
    assignIfDefined(patch, "utm_campaign", utmCampaign);
    assignIfDefined(patch, "prompt_slug", promptSlug);

    if (userId) {
      patch.user_id = userId;
    }

    if (status === "magic_link_requested") {
      patch.last_requested_at = now;
      patch.request_count = Number(existingRow.request_count ?? 0) + 1;
    }

    if (status === "confirmed") {
      patch.confirmed_at = now;
    }

    const { error } = await supabase.from(table).update(patch).eq("email", normalizedEmail);
    if (error) throw error;

    return toRecord({
      ...existingRow,
      source: (patch.source as string | undefined) ?? existingRow.source,
      redirect_to: (patch.redirect_to as string | undefined) ?? existingRow.redirect_to,
      signup_url: (patch.signup_url as string | undefined) ?? existingRow.signup_url,
      referrer: (patch.referrer as string | undefined) ?? existingRow.referrer,
      utm_source: (patch.utm_source as string | undefined) ?? existingRow.utm_source,
      utm_medium: (patch.utm_medium as string | undefined) ?? existingRow.utm_medium,
      utm_campaign: (patch.utm_campaign as string | undefined) ?? existingRow.utm_campaign,
      prompt_slug: (patch.prompt_slug as string | undefined) ?? existingRow.prompt_slug,
      user_id: (patch.user_id as string | undefined) ?? existingRow.user_id,
    } as EmailSignupRow);
  }

  const insertRow = {
    email: normalizedEmail,
    status,
    source: source ?? "prompt_library",
    redirect_to: redirectTo ?? null,
    signup_url: signupUrl ?? null,
    referrer: referrer ?? null,
    utm_source: utmSource ?? null,
    utm_medium: utmMedium ?? null,
    utm_campaign: utmCampaign ?? null,
    prompt_slug: promptSlug ?? null,
    user_id: userId ?? null,
    request_count: status === "magic_link_requested" ? 1 : 0,
    last_requested_at: status === "magic_link_requested" ? now : null,
    confirmed_at: status === "confirmed" ? now : null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from(table).insert(insertRow);

  if (error) throw error;

  return toRecord({
    ...insertRow,
    crm_contact_id: null,
  });
}

export async function recordEmailSignupRequest(options: EmailSignupOptions) {
  return upsertEmailSignup({ ...options, status: "magic_link_requested" });
}

export async function markEmailSignupConfirmed(options: EmailSignupOptions) {
  return upsertEmailSignup({ ...options, status: "confirmed" });
}

export async function updateEmailSignupCrmSync({
  email,
  provider,
  contactId,
  error,
}: {
  email: string;
  provider: string;
  contactId?: string;
  error?: string;
}) {
  if (!isSupabaseDatabaseEnabled()) return;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const patch: Record<string, unknown> = {
    crm_provider: provider,
    crm_synced_at: error ? null : new Date().toISOString(),
    crm_sync_error: error ?? null,
  };

  if (contactId) {
    patch.crm_contact_id = contactId;
  }

  const supabase = createSupabaseAdminClient();
  const { error: updateError } = await supabase.from(table).update(patch).eq("email", normalizedEmail);
  if (updateError) throw updateError;
}
