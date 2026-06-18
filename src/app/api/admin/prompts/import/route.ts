import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { createPrompt } from "@/lib/prompt-data";
import { parsePromptImport } from "@/lib/prompt-import";
import { recordAnalyticsEvent } from "@/lib/store";
import type { PromptAccessLevel, PromptStatus } from "@/lib/types";

type ImportPayload = {
  content?: string;
  defaultAccessLevel?: PromptAccessLevel;
  defaultCategorySlug?: string;
  defaultStatus?: PromptStatus;
};

export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const payload = await parseJson<ImportPayload>(request, {});
  if (!payload.content?.trim()) {
    return NextResponse.json({ message: "Upload a CSV or JSON file, or paste prompt rows first." }, { status: 400 });
  }

  let imported;
  try {
    imported = parsePromptImport(payload.content, {
      defaultAccessLevel: payload.defaultAccessLevel,
      defaultCategorySlug: payload.defaultCategorySlug,
      defaultStatus: payload.defaultStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import parsing failed.";
    return NextResponse.json({ message }, { status: 400 });
  }

  if (!imported.length) {
    return NextResponse.json({ message: "No prompt rows found in that upload." }, { status: 400 });
  }

  if (imported.length > 100) {
    return NextResponse.json({ message: "Import up to 100 prompts at a time." }, { status: 400 });
  }

  const created = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (const [index, prompt] of imported.entries()) {
    try {
      const createdPrompt = await createPrompt({
        ...prompt,
        createdByUserId: session.userId,
        sourceNotes: prompt.sourceNotes ?? "Imported from admin prompt upload.",
      });
      created.push(createdPrompt);
    } catch (error) {
      errors.push({
        row: index + 1,
        message: error instanceof Error ? error.message : "Create failed.",
      });
    }
  }

  recordAnalyticsEvent({
    eventName: "prompt_import_completed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: {
      requestedCount: imported.length,
      createdCount: created.length,
      errorCount: errors.length,
    },
  });

  return NextResponse.json({
    message: errors.length
      ? `Imported ${created.length} prompts with ${errors.length} rows needing review.`
      : `Imported ${created.length} prompts.`,
    createdCount: created.length,
    errorCount: errors.length,
    prompts: created,
    errors,
  });
}
