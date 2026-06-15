import { NextResponse } from "next/server";
import { parseJson, requireAdmin } from "@/lib/api";
import { mergeTag } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await context.params;
  const payload = await parseJson<{ targetSlug?: string }>(request, {});
  if (!payload.targetSlug) return NextResponse.json({ message: "targetSlug is required." }, { status: 400 });
  const result = mergeTag(id, payload.targetSlug);
  if (!result) return NextResponse.json({ message: "Tag merge failed." }, { status: 404 });
  return NextResponse.json(result);
}

