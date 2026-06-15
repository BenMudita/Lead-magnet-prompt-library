import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { createPrompt, getPrompts, recordAnalyticsEvent } from "@/lib/store";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json({ prompts: getPrompts(true) });
}

export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const payload = await parseJson<{ title?: string; body?: string; categorySlug?: string }>(request, {});
  if (!payload.title || !payload.body || !payload.categorySlug) {
    return NextResponse.json({ message: "title, body, and categorySlug are required." }, { status: 400 });
  }

  const prompt = createPrompt({
    title: payload.title,
    body: payload.body,
    categorySlug: payload.categorySlug,
    createdByUserId: session.userId,
  });
  recordAnalyticsEvent({
    eventName: "prompt_created",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: prompt.id },
  });

  return NextResponse.json({ id: prompt.id, prompt });
}

