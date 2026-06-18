import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { publicSearch } from "@/lib/library";

export async function GET(request: Request) {
  const session = await getSession();
  const url = new URL(request.url);
  const prompts = await publicSearch(
    {
      query: url.searchParams.get("q") ?? undefined,
      categorySlug: url.searchParams.get("category") ?? undefined,
      tagSlugs: url.searchParams.get("tags")?.split(",").filter(Boolean),
      sort: (url.searchParams.get("sort") as "recommended" | "helpful" | "used" | "newest" | null) ?? undefined,
    },
    session,
  );
  return NextResponse.json({ prompts });
}
