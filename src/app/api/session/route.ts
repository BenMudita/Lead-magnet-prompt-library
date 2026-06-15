import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { clearSession, getSession, setSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

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

  const payload = await parseJson<{ email?: string }>(request, {});
  const accountStatus = "free";
  const email = payload.email ?? "member@muditastudios.com";
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
