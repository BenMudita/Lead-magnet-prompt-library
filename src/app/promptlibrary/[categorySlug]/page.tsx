import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FilterChips } from "@/components/filter-chips";
import { MuditaHeader } from "@/components/mudita-header";
import { PromptGrid } from "@/components/prompt-grid";
import { SearchBar } from "@/components/search-bar";
import { availableFilterTags, publicSearch } from "@/lib/library";
import { getCategoryBySlug } from "@/lib/prompt-data";
import { recordAnalyticsEvent } from "@/lib/store";
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
  const tab = (queryParams.tab as "all" | "trending" | "most-copied" | "highest-rated" | "new" | undefined) ?? "all";
  const sort =
    tab === "highest-rated" ? "helpful" : tab === "new" ? "newest" : tab === "trending" || tab === "most-copied" ? "used" : undefined;
  const [tags, filtered] = await Promise.all([
    availableFilterTags(category.slug),
    publicSearch({ categorySlug: category.slug, query: q, tagSlugs: activeTags, sort }, session),
  ]);

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
        <h1>{category.name} prompts</h1>
        <p>{category.description.replace("Prompts for", "Ready-to-use prompts for")}</p>
        <SearchBar
          initialQuery={q}
          categorySlug={category.slug}
          label={`Search within ${category.name}`}
          placeholder={`Search within ${category.name}...`}
          compact
        />
      </section>

      <section className="page-section tight">
        <div className="toolbar">
          <FilterChips
            tags={tags}
            activeTags={activeTags}
              basePath={`/promptlibrary/${category.slug}`}
              searchParams={{ q, tab }}
            />
          <div className="sort-links" aria-label="Sort prompts">
            {[
              ["all", "All"],
              ["trending", "Trending"],
              ["most-copied", "Most copied"],
              ["highest-rated", "Highest rated"],
              ["new", "New"],
            ].map(([option, label]) => (
              <Link
                key={option}
                className={tab === option ? "sort-link active" : "sort-link"}
                href={`/promptlibrary/${category.slug}?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(activeTags.length ? { tags: activeTags.join(",") } : {}),
                  ...(option !== "all" ? { tab: option } : {}),
                }).toString()}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section" aria-labelledby="filtered-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{filtered.length} prompts</p>
            <h2 id="filtered-heading">{tab === "all" ? `All ${category.name.toLowerCase()} prompts` : `${category.name} prompts by ${tab.replace("-", " ")}`}</h2>
          </div>
          <Link href={`/promptlibrary/search?category=${category.slug}`} className="text-link">
            Search all prompts instead <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <PromptGrid prompts={filtered} />
      </section>
    </main>
  );
}
