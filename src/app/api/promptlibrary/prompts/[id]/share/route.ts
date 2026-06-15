import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPromptById, incrementMetric, recordAnalyticsEvent } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const session = await getSession();
  const { id } = await context.params;
  const prompt = getPromptById(id);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  incrementMetric(id, "shareCount");
  const url = new URL(`/promptlibrary/p/${prompt.slug}`, request.url);
  if (session.userId) url.searchParams.set("ref", session.userId);

  recordAnalyticsEvent({
    eventName: "prompt_shared",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id },
  });
  return NextResponse.json({ url: url.toString() });
}

