import { NextResponse } from "next/server";
import { canCopyPrompt } from "@/lib/library";
import { getSession } from "@/lib/session";
import { getPromptById, incrementMetric, isRateLimited, recordAnalyticsEvent } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const session = await getSession();
  const { id } = await context.params;
  const prompt = getPromptById(id);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  if (isRateLimited(`copy:${session.userId ?? session.anonymousId}:${id}`, 20)) {
    return NextResponse.json({ message: "Too many copy attempts. Try again soon." }, { status: 429 });
  }

  recordAnalyticsEvent({
    eventName: "prompt_copy_clicked",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id, accessLevel: prompt.accessLevel },
  });

  if (!canCopyPrompt(session, prompt)) {
    recordAnalyticsEvent({
      eventName: "signup_wall_viewed",
      anonymousId: session.anonymousId,
      userId: session.userId,
      properties: { promptId: id, trigger: "copy" },
    });
    return NextResponse.json({ message: "Upgrade to Pro to copy this prompt." }, { status: 402 });
  }

  incrementMetric(id, "copyCount");
  recordAnalyticsEvent({
    eventName: "prompt_copy_succeeded",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id },
  });
  return NextResponse.json({ body: prompt.body });
}

