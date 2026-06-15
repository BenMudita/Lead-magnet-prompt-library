import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { getCategoryBySlug, getPromptById, updatePrompt } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const prompt = getPromptById(id, true);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  const category = getCategoryBySlug(prompt.categorySlug);
  const explanation = `Helps a beginner turn rough ${category?.name.toLowerCase() ?? "work"} context into a clear first draft, plan, or decision.`;
  const updated = updatePrompt(id, { plainEnglishExplanation: explanation });
  return NextResponse.json({ message: "Local explanation stub generated.", prompt: updated });
}

