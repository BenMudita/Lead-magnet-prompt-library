import { NextResponse } from "next/server";
import { publicSearch } from "@/lib/library";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const prompts = await publicSearch(
    {
      query,
      categorySlug: url.searchParams.get("category") ?? undefined,
      tagSlugs: url.searchParams.get("tags")?.split(",").filter(Boolean),
      sort: (url.searchParams.get("sort") as "recommended" | "helpful" | "used" | "newest" | null) ?? undefined,
    },
    session,
  );

  recordAnalyticsEvent({
    eventName: prompts.length ? "search_results_viewed" : "zero_results_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { query, resultCount: prompts.length },
  });

  return NextResponse.json({ prompts });
}
