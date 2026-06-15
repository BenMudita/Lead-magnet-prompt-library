import { NextResponse } from "next/server";
import { toPublicPrompt } from "@/lib/library";
import { getSession } from "@/lib/session";
import { getPromptById, getPromptBySlug, incrementMetric } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const prompt = getPromptById(id) ?? getPromptBySlug(id);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  incrementMetric(prompt.id, "viewsCount");
  return NextResponse.json({ prompt: toPublicPrompt(prompt, await getSession()) });
}

