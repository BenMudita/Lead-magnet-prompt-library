import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { moderateUseNote } from "@/lib/prompt-data";
import { recordAnalyticsEvent } from "@/lib/store";
import type { UseNoteStatus } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const payload = await parseJson<{
    status?: UseNoteStatus;
    body?: string;
    isFeatured?: boolean;
    isMuditaTeamNote?: boolean;
  }>(request, {});
  if (payload.status !== "approved" && payload.status !== "rejected" && payload.status !== "pending") {
    return NextResponse.json({ message: "Invalid use note status." }, { status: 400 });
  }
  const note = await moderateUseNote({
    id,
    status: payload.status,
    moderatorUserId: session.userId ?? "admin",
    body: payload.body,
    isFeatured: payload.isFeatured,
    isMuditaTeamNote: payload.isMuditaTeamNote,
  });
  if (!note) return NextResponse.json({ message: "Use note not found." }, { status: 404 });
  recordAnalyticsEvent({
    eventName: payload.status === "approved" ? "use_note_approved" : "use_note_rejected",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { useNoteId: id, promptId: note.promptId },
  });
  return NextResponse.json({ note });
}
