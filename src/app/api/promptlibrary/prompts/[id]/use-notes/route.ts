import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { getSession } from "@/lib/session";
import { addUseNote, getPromptById } from "@/lib/prompt-data";
import { isRateLimited, recordAnalyticsEvent } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const session = await getSession();
  const { id } = await context.params;
  if (!(await getPromptById(id))) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  if (session.accountStatus === "guest") {
    return NextResponse.json({ message: "Create a free account to submit a use note." }, { status: 401 });
  }
  if (isRateLimited(`note:${session.userId ?? session.anonymousId}:${id}`, 4)) {
    return NextResponse.json({ message: "Too many use notes. Try again soon." }, { status: 429 });
  }
  const payload = await parseJson<{ body?: string }>(request, {});
  if (!payload.body?.trim()) {
    return NextResponse.json({ message: "Use note body is required." }, { status: 400 });
  }
  const note = await addUseNote({ promptId: id, userId: session.userId, body: payload.body });
  recordAnalyticsEvent({
    eventName: "use_note_submitted",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id },
  });

  return NextResponse.json({ note });
}
