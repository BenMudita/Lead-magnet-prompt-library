import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { getTags, upsertTag } from "@/lib/store";
import type { TagStatus } from "@/lib/types";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  return NextResponse.json({ tags: getTags(true) });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const payload = await parseJson<{ name?: string; status?: TagStatus }>(request, {});
  if (!payload.name) return NextResponse.json({ message: "Tag name is required." }, { status: 400 });
  return NextResponse.json({ tag: upsertTag(payload.name, payload.status ?? "approved") });
}

