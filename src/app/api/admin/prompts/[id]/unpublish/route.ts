import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { updatePrompt } from "@/lib/prompt-data";
import { recordAnalyticsEvent } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const prompt = await updatePrompt(id, { status: "in_review" });
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  recordAnalyticsEvent({
    eventName: "prompt_unpublished",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id },
  });
  return NextResponse.json({ message: "Prompt moved to review.", prompt });
}
