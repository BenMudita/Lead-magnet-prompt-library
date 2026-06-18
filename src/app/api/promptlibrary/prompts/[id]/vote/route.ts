import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { getSession } from "@/lib/session";
import { getPromptById, recordVote } from "@/lib/prompt-data";
import { isRateLimited, recordAnalyticsEvent } from "@/lib/store";
import type { VoteValue } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const session = await getSession();
  const { id } = await context.params;
  if (!(await getPromptById(id))) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  if (isRateLimited(`vote:${session.userId ?? session.anonymousId}:${id}`, 12)) {
    return NextResponse.json({ message: "Too many votes. Try again soon." }, { status: 429 });
  }
  const payload = await parseJson<{ vote?: VoteValue }>(request, {});
  if (payload.vote !== "helpful" && payload.vote !== "not_helpful") {
    return NextResponse.json({ message: "Vote must be helpful or not_helpful." }, { status: 400 });
  }

  const vote = await recordVote({
    promptId: id,
    userId: session.userId,
    anonymousId: session.anonymousId,
    vote: payload.vote,
  });
  recordAnalyticsEvent({
    eventName: payload.vote === "helpful" ? "prompt_helpful_voted" : "prompt_not_helpful_voted",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id },
  });

  return NextResponse.json({ vote });
}
