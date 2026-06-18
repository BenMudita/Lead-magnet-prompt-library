import { NextResponse } from "next/server";
import { parseJson } from "@/lib/api";
import { canCopyPrompt } from "@/lib/library";
import { getSession } from "@/lib/session";
import { getPromptById, incrementMetric, recordAnalyticsEvent } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const session = await getSession();
  const { id } = await context.params;
  const prompt = getPromptById(id);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  const payload = await parseJson<{ provider?: "chatgpt" | "claude" }>(request, {});
  const provider = payload.provider === "claude" ? "claude" : "chatgpt";

  if (!canCopyPrompt(session, prompt)) {
    return NextResponse.json(
      {
        message: "Create a free account with your email to send this prompt.",
        redirectUrl: `/promptlibrary/signup?redirect=${encodeURIComponent(`/promptlibrary/p/${prompt.slug}`)}`,
      },
      { status: 401 },
    );
  }

  incrementMetric(id, provider === "claude" ? "sendClaudeCount" : "sendChatgptCount");
  recordAnalyticsEvent({
    eventName: provider === "claude" ? "send_to_claude_clicked" : "send_to_chatgpt_clicked",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id, handoff: "copy_plus_open" },
  });
  recordAnalyticsEvent({
    eventName: "send_to_model_fallback_used",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id, provider },
  });

  return NextResponse.json({
    body: prompt.body,
    url: provider === "claude" ? "https://claude.ai/new" : "https://chatgpt.com/",
    message: "Prompt copied. Paste it into the model site.",
  });
}
