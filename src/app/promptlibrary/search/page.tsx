import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FilterChips } from "@/components/filter-chips";
import { MuditaHeader } from "@/components/mudita-header";
import { PromptGrid } from "@/components/prompt-grid";
import { QuickFilterChips } from "@/components/quick-filter-chips";
import { SearchBar } from "@/components/search-bar";
import { availableFilterTags, homepagePicks, publicSearch, quickFilters } from "@/lib/library";
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
  const hasActiveSearch = Boolean(q || category || activeTags.length || sort);
  const [results, defaultPicks, tags] = await Promise.all([
    publicSearch({ query: q, categorySlug: category, tagSlugs: activeTags, sort }, session),
    homepagePicks(session),
    availableFilterTags(category),
  ]);
  const visibleResults = hasActiveSearch ? results : defaultPicks;

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
        <p className="eyebrow">Search the library</p>
        <h1>{q ? `Results for "${q}"` : "What are you trying to do?"}</h1>
        <SearchBar
          large
          initialQuery={q}
          categorySlug={category}
          label="Search prompts"
          placeholder="Search by task, role, or outcome..."
          helperText="Try investor update, sales follow-up, content calendar, or meeting summary."
        />
        <QuickFilterChips
          filters={quickFilters}
          activeCategory={category}
          activeTags={activeTags}
          showClear={hasActiveSearch}
        />
      </section>

      {hasActiveSearch ? (
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
                  {option === "used" ? "Most copied" : option === "helpful" ? "Highest rated" : option[0].toUpperCase() + option.slice(1)}
              </Link>
            ))}
          </div>
          </div>
        </section>
      ) : null}

      <section className="page-section" aria-labelledby="results-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{hasActiveSearch ? `${results.length} results` : "Mudita Picks"}</p>
            <h2 id="results-heading">{hasActiveSearch ? "Matching prompts" : "Prompts our team recommends starting with"}</h2>
          </div>
          {category ? (
            <Link href={`/promptlibrary/search?${new URLSearchParams({ ...(q ? { q } : {}) }).toString()}`} className="text-link">
              Clear category <ArrowRight className="icon-sm" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <PromptGrid prompts={visibleResults} />
      </section>

      {!visibleResults.length ? (
        <section className="page-section" aria-labelledby="suggestions-heading">
          <div className="section-heading">
            <h2 id="suggestions-heading">No prompts found. Try a broader task like email, planning, launch, or research.</h2>
          </div>
          <QuickFilterChips filters={quickFilters} showClear />
        </section>
      ) : null}
    </main>
  );
}
