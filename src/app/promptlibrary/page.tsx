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

const sortOptions = [
  ["recommended", "Recommended"],
  ["helpful", "Helpful"],
  ["used", "Most used"],
  ["newest", "Newest"],
] as const;

const libraryHref = (
  current: {
    q?: string;
    category?: string;
    tags?: string;
    sort?: string;
  },
  next: {
    q?: string;
    category?: string;
    tags?: string;
    sort?: string;
  },
) => {
  const params = new URLSearchParams();
  const merged = { ...current, ...next };

  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const query = params.toString();
  return `/promptlibrary${query ? `?${query}` : ""}#prompt-library`;
};

export default async function PromptLibraryHome({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();
  const q = params.q ?? "";
  const category = params.category;
  const activeTags = params.tags?.split(",").filter(Boolean) ?? [];
  const sort = params.sort as "recommended" | "helpful" | "used" | "newest" | undefined;
  const [tags, categories, prompts] = await Promise.all([
    availableFilterTags(category),
    categoryStats(),
    publicSearch({ query: q, categorySlug: category, tagSlugs: activeTags, sort }, session),
  ]);
  const currentParams = {
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(activeTags.length ? { tags: activeTags.join(",") } : {}),
    ...(sort ? { sort } : {}),
  };
  const activeSort = sort ?? "recommended";
  const activeCategory = categories.find(({ category: item }) => item.slug === category)?.category;

  recordAnalyticsEvent({
    eventName: "prompt_library_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: {
      accountStatus: session.accountStatus,
      query: q,
      category,
      tags: activeTags,
      sort: activeSort,
      resultCount: prompts.length,
    },
  });

  return (
    <main>
      <MuditaHeader />
      <section className="page-section library-filter-section" id="prompt-library" aria-labelledby="library-heading">
        <div className="section-heading library-results-heading">
          <div>
            <p className="eyebrow">{prompts.length} prompts</p>
            <h2 id="library-heading">
              {activeCategory ? `${activeCategory.name} prompts` : q ? `Results for "${q}"` : "All prompt library"}
            </h2>
          </div>
          <div className="library-heading-actions" id="library-search">
            <SearchBar
              initialQuery={q}
              categorySlug={category}
              label="Search prompts"
              placeholder="Try email, hiring, budget, launch, onboarding..."
              destination="/promptlibrary"
              fragment="prompt-library"
            />
            {Object.keys(currentParams).length ? (
              <Link href="/promptlibrary#prompt-library" className="text-link">
                Clear filters <ArrowRight className="icon-sm" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="library-filter-panel" aria-label="Library filters">
          <div className="filter-group">
            <span className="filter-label">Industries and functions</span>
            <div className="quick-chip-row library-chip-row" aria-label="Industry and function filters">
              <Link
                href={libraryHref(currentParams, { category: undefined })}
                className={category ? "quick-chip" : "quick-chip active"}
              >
                All
              </Link>
              {categories.map(({ category: item, promptCount }) => (
                <Link
                  key={item.id}
                  href={libraryHref(currentParams, { category: item.slug })}
                  className={category === item.slug ? "quick-chip active" : "quick-chip"}
                  aria-current={category === item.slug ? "true" : undefined}
                >
                  {item.name}
                  <span>{promptCount}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Sort</span>
            <div className="sort-links library-sort-links" aria-label="Sort prompts">
              {sortOptions.map(([option, label]) => (
                <Link
                  key={option}
                  className={activeSort === option ? "sort-link active" : "sort-link"}
                  href={libraryHref(currentParams, { sort: option === "recommended" ? undefined : option })}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="filter-group filter-group-wide">
            <span className="filter-label">Task filters</span>
            <FilterChips
              tags={tags}
              activeTags={activeTags}
              basePath="/promptlibrary"
              searchParams={{ q, category, sort }}
              fragment="prompt-library"
            />
          </div>
        </div>
      </section>

      <section className="page-section library-results-section" aria-label="Prompt results">
        <PromptGrid prompts={prompts} />
      </section>
    </main>
  );
}
