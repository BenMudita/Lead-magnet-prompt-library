import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { FilterChips } from "@/components/filter-chips";
import { LibraryHero } from "@/components/library-hero";
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
  const hasActiveSearch = Boolean(q || category || activeTags.length || sort);
  const results = publicSearch({ query: q, categorySlug: category, tagSlugs: activeTags, sort }, session);
  const defaultPicks = publicSearch({ sort: "recommended" }, session)
    .filter((prompt) => prompt.isFeatured)
    .slice(0, 6);
  const visibleResults = hasActiveSearch ? results : defaultPicks;
  const tags = availableFilterTags(category);
  const stats = categoryStats();
  const totals = stats.reduce(
    (memo, item) => ({
      promptCount: memo.promptCount + item.promptCount,
      testedCount: memo.testedCount + item.testedCount,
    }),
    { promptCount: 0, testedCount: 0 },
  );

  recordAnalyticsEvent({
    eventName: results.length ? "search_results_viewed" : "zero_results_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { query: q, category, tags: activeTags, resultCount: results.length },
  });

  return (
    <main>
      <MuditaHeader />
      {hasActiveSearch ? (
        <section className="search-page-head">
          <p className="eyebrow">Global search</p>
          <h1>{q ? `Results for "${q}"` : "Search the Mudita Prompt Library"}</h1>
          <SearchBar initialQuery={q} categorySlug={category} placeholder="Search by task, role, or phrase" />
        </section>
      ) : (
          <LibraryHero
            totalPrompts={totals.promptCount}
            testedPrompts={totals.testedCount}
            picksHref="#results-heading"
          />
      )}

      {!hasActiveSearch ? (
        <section className="search-band" aria-labelledby="search-heading">
          <div>
            <h2 id="search-heading">Search if you know what you need</h2>
            <p>Browsing by work area is the best starting point.</p>
          </div>
          <SearchBar initialQuery={q} categorySlug={category} placeholder="Try email, hiring, budget, launch, onboarding" />
        </section>
      ) : null}

      {!hasActiveSearch ? (
        <section className="page-section" aria-labelledby="category-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow orange">Start here</p>
              <h2 id="category-heading">Choose your industry or function</h2>
            </div>
          </div>
          <div className="category-grid">
            {stats.map(({ category: item, promptCount, testedCount }) => (
              <Link href={`/promptlibrary/${item.slug}`} className={`category-tile accent-${item.accent}`} key={item.id}>
                <CategoryIcon name={item.icon} className="h-6 w-6" />
                <span className="tile-title">{item.name}</span>
                <span className="tile-copy">{item.description}</span>
                <span className="tile-meta">
                  {promptCount} prompts · free account · {testedCount} tested
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
                  {option === "used" ? "Most used" : option[0].toUpperCase() + option.slice(1)}
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
            <h2 id="results-heading">{category ? "Category-prefiltered search" : "Mudita Picks"}</h2>
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
