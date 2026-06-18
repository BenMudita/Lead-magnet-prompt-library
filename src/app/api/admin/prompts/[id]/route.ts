import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { getCategoryBySlug, getPromptById, updatePrompt } from "@/lib/prompt-data";
import type { Prompt } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const prompt = await getPromptById(id, true);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  return NextResponse.json({ prompt });
}

export async function PATCH(request: Request, context: Context) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const payload = await parseJson<Partial<Prompt>>(request, {});
  const category = payload.categorySlug ? getCategoryBySlug(payload.categorySlug) : undefined;
  const patch: Partial<Prompt> = {
    ...payload,
    categoryId: category?.id ?? payload.categoryId,
  };
  const prompt = await updatePrompt(id, patch);
  if (!prompt) return NextResponse.json({ message: "Prompt not found." }, { status: 404 });
  return NextResponse.json({ prompt });
}
