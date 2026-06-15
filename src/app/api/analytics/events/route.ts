import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export async function POST(request: Request) {
  const session = await getSession();
  const payload = await parseJson<{
    eventName?: string;
    properties?: Record<string, unknown>;
    url?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }>(request, {});

  if (!payload.eventName) {
    return NextResponse.json({ message: "eventName is required." }, { status: 400 });
  }

  const event = recordAnalyticsEvent({
    eventName: payload.eventName,
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: payload.properties ?? {},
    url: payload.url,
    referrer: payload.referrer,
    utmSource: payload.utmSource,
    utmMedium: payload.utmMedium,
    utmCampaign: payload.utmCampaign,
  });

  return NextResponse.json({ ok: true, event });
}

