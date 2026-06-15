import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { getCategoryBySlug, getPromptById, recordAnalyticsEvent, updatePrompt, upsertTag } from "@/lib/store";
import { slugify } from "@/lib/content";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const prompt = getPromptById(id, true);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });

  const category = getCategoryBySlug(prompt.categorySlug);
  const suggested = Array.from(
    new Set([
      ...(category?.primaryTags ?? []),
      ...prompt.title
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 5)
        .slice(0, 2),
      "approved",
    ].map(slugify)),
  ).slice(0, 6);
  suggested.forEach((tagSlug) => upsertTag(tagSlug.replace(/-/g, " "), "approved"));
  const updated = updatePrompt(id, { tagSlugs: suggested });
  recordAnalyticsEvent({
    eventName: "prompt_ai_tags_generated",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id, localStub: true },
  });
  recordAnalyticsEvent({
    eventName: "prompt_tags_approved",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: id, tagSlugs: suggested },
  });

  return NextResponse.json({ message: "Local AI-tag stub generated reviewed tags.", prompt: updated });
}

