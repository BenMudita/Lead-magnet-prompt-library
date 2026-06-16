import type { User } from "@supabase/supabase-js";
import { hasSupabaseAdminConfig } from "@/lib/env";
import type { AccountStatus, Session, UserRole } from "@/lib/types";
import { createSupabaseAdminClient, createSupabaseServerClient } from "./server";

type SupabaseProfile = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  subscription_status: string | null;
};

const ADMIN_EMAIL_DOMAIN = "muditastudios.com";

export const isMuditaAdminEmail = (email?: string | null) =>
  email?.toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`) ?? false;

const validRole = (value?: string | null): UserRole => {
  if (value === "admin" || value === "editor" || value === "moderator" || value === "analyst") {
    return value;
  }
  return value === "member" ? "member" : "member";
};

const accountStatusFromProfile = (value?: string | null): AccountStatus =>
  value === "active" ? "pro" : "free";

export const sessionFromSupabaseUser = ({
  user,
  profile,
  anonymousId,
}: {
  user: User;
  profile?: SupabaseProfile | null;
  anonymousId: string;
}): Session => ({
  accountStatus: accountStatusFromProfile(profile?.subscription_status),
  role: isMuditaAdminEmail(profile?.email ?? user.email) ? "admin" : validRole(profile?.role),
  email: profile?.email ?? user.email,
  userId: user.id,
  anonymousId,
});

export async function getSupabaseProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,name,role,subscription_status")
    .eq("id", userId)
    .maybeSingle();

  return data as SupabaseProfile | null;
}

export async function ensureSupabaseProfile(user: User) {
  if (!hasSupabaseAdminConfig()) return;

  const supabase = createSupabaseAdminClient();
  const email = user.email ?? "";
  const role = isMuditaAdminEmail(email) ? "admin" : "member";
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("profiles")
      .update({ email, role, last_login_at: now })
      .eq("id", user.id);
    return;
  }

  await supabase.from("profiles").insert({
    id: user.id,
    email,
    role,
    auth_provider: "supabase",
    subscription_status: "free",
    created_at: now,
    last_login_at: now,
  });
}
