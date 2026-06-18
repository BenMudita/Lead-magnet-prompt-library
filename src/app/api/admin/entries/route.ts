import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { createDirectoryEntry, listDirectoryEntries } from "@/lib/directory";
import { recordAnalyticsEvent } from "@/lib/store";
import type { LeadMagnetEntry } from "@/lib/types";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json({ entries: await listDirectoryEntries({ includeDrafts: true }) });
}

export async function POST(request: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const payload = await parseJson<Partial<LeadMagnetEntry>>(request, {});
  if (!payload.title || !payload.summary || !payload.category) {
    return NextResponse.json({ message: "title, summary, and category are required." }, { status: 400 });
  }

  try {
    const entry = await createDirectoryEntry({
      ...payload,
      title: payload.title,
      summary: payload.summary,
      category: payload.category,
    });
    recordAnalyticsEvent({
      eventName: "lead_magnet_entry_created",
      anonymousId: session.anonymousId,
      userId: session.userId,
      properties: { entryId: entry.id },
    });
    return NextResponse.json({ id: entry.id, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create entry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

