import { cookies } from "next/headers";
import { isSupabaseAuthEnabled } from "./env";
import { getSupabaseProfile, sessionFromSupabaseUser } from "./supabase/profiles";
import { createSupabaseServerClient } from "./supabase/server";
import type { AccountStatus, Session, UserRole } from "./types";

const STATUS_COOKIE = "mudita_status";
const ROLE_COOKIE = "mudita_role";
const EMAIL_COOKIE = "mudita_email";
const USER_COOKIE = "mudita_user";
const ANON_COOKIE = "mudita_anon";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

const validAccountStatus = (value?: string): AccountStatus =>
  value === "free" || value === "pro" ? value : "guest";

const validRole = (value?: string): UserRole => {
  if (value === "admin" || value === "editor" || value === "moderator" || value === "analyst") {
    return value;
  }
  return value === "member" ? "member" : "visitor";
};

export const isAdminRole = (role: UserRole) =>
  role === "admin" || role === "editor" || role === "moderator" || role === "analyst";

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(ANON_COOKIE)?.value ?? "anon_preview";

  if (isSupabaseAuthEnabled()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await getSupabaseProfile(user.id);
      return sessionFromSupabaseUser({ user, profile, anonymousId });
    }

    return {
      accountStatus: "guest",
      role: "visitor",
      anonymousId,
    };
  }

  const accountStatus = validAccountStatus(cookieStore.get(STATUS_COOKIE)?.value);
  const role = validRole(cookieStore.get(ROLE_COOKIE)?.value);
  const email = cookieStore.get(EMAIL_COOKIE)?.value;
  const userId = cookieStore.get(USER_COOKIE)?.value;

  return {
    accountStatus,
    role: accountStatus === "guest" ? "visitor" : role,
    email,
    userId,
    anonymousId,
  };
}

export async function setSession({
  accountStatus,
  role,
  email,
}: {
  accountStatus: AccountStatus;
  role?: UserRole;
  email?: string;
}) {
  if (isSupabaseAuthEnabled()) {
    throw new Error("Demo sessions are disabled when AUTH_PROVIDER=supabase.");
  }

  const cookieStore = await cookies();
  const anonymousId =
    cookieStore.get(ANON_COOKIE)?.value ?? `anon_${Math.random().toString(36).slice(2, 12)}`;
  const resolvedRole = role ?? (accountStatus === "guest" ? "visitor" : "member");
  const userId = accountStatus === "guest" ? "" : `user_${(email ?? "demo").replace(/[^a-z0-9]/gi, "_")}`;

  cookieStore.set(ANON_COOKIE, anonymousId, cookieOptions);
  cookieStore.set(STATUS_COOKIE, accountStatus, cookieOptions);
  cookieStore.set(ROLE_COOKIE, resolvedRole, cookieOptions);
  if (email) cookieStore.set(EMAIL_COOKIE, email, cookieOptions);
  if (userId) cookieStore.set(USER_COOKIE, userId, cookieOptions);
}

export async function clearSession() {
  const cookieStore = await cookies();
  if (isSupabaseAuthEnabled()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  cookieStore.delete(STATUS_COOKIE);
  cookieStore.delete(ROLE_COOKIE);
  cookieStore.delete(EMAIL_COOKIE);
  cookieStore.delete(USER_COOKIE);
}
