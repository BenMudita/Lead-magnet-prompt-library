import { isSupabaseDatabaseEnabled } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type EmailSignupStatus = "magic_link_requested" | "confirmed";

type EmailSignupOptions = {
  email: string;
  source?: string;
  redirectTo?: string;
  userId?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const table = "email_signups";

async function upsertEmailSignup({
  email,
  source,
  redirectTo,
  userId,
  status,
}: EmailSignupOptions & { status: EmailSignupStatus }) {
  if (!isSupabaseDatabaseEnabled()) return;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: existing, error: readError } = await supabase
    .from(table)
    .select("email,request_count")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    const patch: Record<string, unknown> = {
      status,
      source: source ?? "prompt_library",
      redirect_to: redirectTo ?? null,
      updated_at: now,
    };

    if (userId) {
      patch.user_id = userId;
    }

    if (status === "magic_link_requested") {
      patch.last_requested_at = now;
      patch.request_count = Number(existing.request_count ?? 0) + 1;
    }

    if (status === "confirmed") {
      patch.confirmed_at = now;
    }

    const { error } = await supabase.from(table).update(patch).eq("email", normalizedEmail);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from(table).insert({
    email: normalizedEmail,
    status,
    source: source ?? "prompt_library",
    redirect_to: redirectTo ?? null,
    user_id: userId ?? null,
    request_count: status === "magic_link_requested" ? 1 : 0,
    last_requested_at: status === "magic_link_requested" ? now : null,
    confirmed_at: status === "confirmed" ? now : null,
    created_at: now,
    updated_at: now,
  });

  if (error) throw error;
}

export async function recordEmailSignupRequest(options: EmailSignupOptions) {
  await upsertEmailSignup({ ...options, status: "magic_link_requested" });
}

export async function markEmailSignupConfirmed(options: EmailSignupOptions) {
  await upsertEmailSignup({ ...options, status: "confirmed" });
}
