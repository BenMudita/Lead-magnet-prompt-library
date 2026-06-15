import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FilterChips } from "@/components/filter-chips";
import { MuditaHeader } from "@/components/mudita-header";
import { PromptGrid } from "@/components/prompt-grid";
import { SearchBar } from "@/components/search-bar";
import { availableFilterTags, getCategoryRows, publicSearch } from "@/lib/library";
import { getCategoryBySlug, recordAnalyticsEvent } from "@/lib/store";
import { getSession } from "@/lib/session";

type Props = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const queryParams = await searchParams;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const session = await getSession();
  const q = queryParams.q ?? "";
  const activeTags = queryParams.tags?.split(",").filter(Boolean) ?? [];
  const sort = queryParams.sort as "recommended" | "helpful" | "used" | "newest" | undefined;
  const tags = availableFilterTags(category.slug);
  const filtered = publicSearch({ categorySlug: category.slug, query: q, tagSlugs: activeTags, sort }, session);
  const rows = getCategoryRows(category.slug, session);
  const hasFilters = Boolean(q || activeTags.length || sort);

  recordAnalyticsEvent({
    eventName: q ? "category_search_submitted" : "category_tile_clicked",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { category: category.slug, query: q, tags: activeTags },
  });

  return (
    <main>
      <MuditaHeader />
      <section className={`category-hero accent-${category.accent}`}>
        <p className="eyebrow">Category</p>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
        <SearchBar
          initialQuery={q}
          categorySlug={category.slug}
          placeholder={`Search ${category.name.toLowerCase()} prompts`}
          compact
        />
      </section>

      <section className="page-section tight">
        <div className="toolbar">
          <FilterChips
            tags={tags}
            activeTags={activeTags}
            basePath={`/promptlibrary/${category.slug}`}
            searchParams={{ q, sort }}
          />
          <div className="sort-links" aria-label="Sort prompts">
            {["recommended", "helpful", "used", "newest"].map((option) => (
              <Link
                key={option}
                className={sort === option || (!sort && option === "recommended") ? "sort-link active" : "sort-link"}
                href={`/promptlibrary/${category.slug}?${new URLSearchParams({
                  ...(q ? { q } : {}),
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

      {hasFilters ? (
        <section className="page-section" aria-labelledby="filtered-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Filtered results</p>
              <h2 id="filtered-heading">{filtered.length} prompts found</h2>
            </div>
            <Link href={`/promptlibrary/search?category=${category.slug}`} className="text-link">
              Search globally <ArrowRight className="icon-sm" aria-hidden="true" />
            </Link>
          </div>
          <PromptGrid prompts={filtered} />
        </section>
      ) : (
        <>
          <PromptRow title="Mudita Picks" prompts={rows.picks} />
          <PromptRow title="Top Prompts" prompts={rows.top} />
          <PromptRow title="Most Used" prompts={rows.mostUsed} />
          <PromptRow title="Most Helpful" prompts={rows.mostHelpful} />
        </>
      )}
    </main>
  );
}

function PromptRow({ title, prompts }: { title: string; prompts: ReturnType<typeof publicSearch> }) {
  return (
    <section className="page-section" aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>
      <div className="section-heading">
        <h2 id={`${title.replace(/\s+/g, "-").toLowerCase()}-heading`}>{title}</h2>
      </div>
      <PromptGrid prompts={prompts} />
    </section>
  );
}

