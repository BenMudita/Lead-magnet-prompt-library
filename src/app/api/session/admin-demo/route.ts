import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { isSupabaseAuthEnabled } from "@/lib/env";
import { getSession, setSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Admin demo sessions are disabled in production." }, { status: 403 });
  }
  if (isSupabaseAuthEnabled()) {
    return NextResponse.json(
      { message: "Admin demo sessions are disabled when AUTH_PROVIDER=supabase." },
      { status: 403 },
    );
  }

  const payload = await parseJson<{ email?: string }>(request, {});
  await setSession({
    accountStatus: "pro",
    role: "admin",
    email: payload.email ?? "admin@muditastudios.com",
  });
  const session = await getSession();

  recordAnalyticsEvent({
    eventName: "login_completed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { role: "admin", demo: true },
  });

  return NextResponse.json(session);
}
