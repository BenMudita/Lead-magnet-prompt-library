import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { recordAnalyticsEvent, updatePrompt } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const prompt = updatePrompt(id, {
    isMuditaTested: true,
    testedAt: new Date().toISOString(),
    testedByType: "agent",
    testedByUserId: session.userId,
    testingNotes:
      "Local QA mark: editor confirmed the prompt produced useful output for the intended beginner task.",
  });
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  recordAnalyticsEvent({
    eventName: "prompt_tested",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id },
  });
  return NextResponse.json({ message: "Prompt marked Mudita-tested.", prompt });
}

