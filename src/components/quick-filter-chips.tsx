import Link from "next/link";
import type { QuickFilter } from "@/lib/library";

const hrefForFilter = (filter: QuickFilter) => {
  const params = new URLSearchParams();
  if (filter.category) params.set("category", filter.category);
  if (filter.tag) params.set("tags", filter.tag);
  return `/promptlibrary/search?${params.toString()}`;
};

export function QuickFilterChips({
  filters,
  activeCategory,
  activeTags = [],
  showClear = false,
}: {
  filters: QuickFilter[];
  activeCategory?: string;
  activeTags?: string[];
  showClear?: boolean;
}) {
  const hasActive = Boolean(activeCategory || activeTags.length);

  return (
    <div className="quick-chip-row" aria-label="Popular prompt filters">
      {filters.map((filter) => {
        const active =
          (filter.category && filter.category === activeCategory) ||
          (filter.tag && activeTags.includes(filter.tag));

        return (
          <Link
            key={`${filter.category ?? filter.tag}-${filter.label}`}
            className={active ? "quick-chip active" : "quick-chip"}
            href={hrefForFilter(filter)}
            aria-current={active ? "true" : undefined}
          >
            {filter.label}
          </Link>
        );
      })}
      {showClear && hasActive ? (
        <Link className="quick-chip clear" href="/promptlibrary/search">
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
