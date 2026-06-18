import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FilterChips } from "@/components/filter-chips";
import { MuditaHeader } from "@/components/mudita-header";
import { PromptGrid } from "@/components/prompt-grid";
import { SearchBar } from "@/components/search-bar";
import { availableFilterTags, categoryStats, publicSearch } from "@/lib/library";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();
  const q = params.q ?? "";
  const category = params.category;
  const activeTags = params.tags?.split(",").filter(Boolean) ?? [];
  const sort = params.sort as "recommended" | "helpful" | "used" | "newest" | undefined;
  const results = publicSearch({ query: q, categorySlug: category, tagSlugs: activeTags, sort }, session);
  const tags = availableFilterTags(category);

  recordAnalyticsEvent({
    eventName: results.length ? "search_results_viewed" : "zero_results_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { query: q, category, tags: activeTags, resultCount: results.length },
  });

  return (
    <main>
      <MuditaHeader />
      <section className="search-page-head">
        <p className="eyebrow">Global search</p>
        <h1>{q ? `Results for "${q}"` : "Search the Mudita Prompt Library"}</h1>
        <SearchBar initialQuery={q} categorySlug={category} placeholder="Search by task, role, or phrase" />
      </section>

      <section className="page-section tight">
        <div className="toolbar">
          <FilterChips
            tags={tags}
            activeTags={activeTags}
            basePath="/promptlibrary/search"
            searchParams={{ q, category, sort }}
          />
          <div className="sort-links" aria-label="Sort prompts">
            {["recommended", "helpful", "used", "newest"].map((option) => (
              <Link
                key={option}
                className={sort === option || (!sort && option === "recommended") ? "sort-link active" : "sort-link"}
                href={`/promptlibrary/search?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(category ? { category } : {}),
                  ...(activeTags.length ? { tags: activeTags.join(",") } : {}),
                  sort: option,
                }).toString()}`}
              >
                {option === "used" ? "Most used" : option[0].toUpperCase() + option.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section" aria-labelledby="results-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{results.length} results</p>
            <h2 id="results-heading">{category ? "Category-prefiltered search" : "Recommended matches"}</h2>
          </div>
          {category ? (
            <Link href={`/promptlibrary/search?${new URLSearchParams({ ...(q ? { q } : {}) }).toString()}`} className="text-link">
              Clear category <ArrowRight className="icon-sm" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <PromptGrid prompts={results} />
      </section>

      {!results.length ? (
        <section className="page-section" aria-labelledby="suggestions-heading">
          <div className="section-heading">
            <h2 id="suggestions-heading">Try one of these categories</h2>
          </div>
          <div className="mini-category-row">
            {categoryStats().slice(0, 5).map(({ category: item }) => (
              <Link href={`/promptlibrary/${item.slug}`} key={item.id} className="mini-category">
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

