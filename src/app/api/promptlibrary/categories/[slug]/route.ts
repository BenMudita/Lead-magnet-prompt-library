import { NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/store";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const category = getCategoryBySlug(slug);
  if (!category) return NextResponse.json({ message: "Category not found." }, { status: 404 });
  return NextResponse.json({ category });
}

