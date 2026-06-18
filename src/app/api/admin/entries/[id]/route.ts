import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { getDirectoryEntryById, updateDirectoryEntry } from "@/lib/directory";
import type { LeadMagnetEntry } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const entry = await getDirectoryEntryById(id, true);
  if (!entry) return NextResponse.json({ message: "Entry not found." }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function PATCH(request: Request, context: Context) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const payload = await parseJson<Partial<LeadMagnetEntry>>(request, {});

  try {
    const entry = await updateDirectoryEntry(id, payload);
    if (!entry) return NextResponse.json({ message: "Entry not found." }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save entry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

