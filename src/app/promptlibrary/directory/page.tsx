import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { MuditaHeader } from "@/components/mudita-header";
import { SearchBar } from "@/components/search-bar";
import { listDirectoryEntries } from "@/lib/directory";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort();

const isExternalUrl = (url: string) => /^https?:\/\//.test(url);

export default async function LeadMagnetDirectoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? "";
  const category = params.category;
  const entries = await listDirectoryEntries({ query, category });
  const allEntries = await listDirectoryEntries();
  const categories = unique(allEntries.map((entry) => entry.category));
  const featured = entries.filter((entry) => entry.isFeatured);
  const visibleEntries = featured.length && !query && !category ? featured.concat(entries.filter((entry) => !entry.isFeatured)) : entries;

  return (
    <main>
      <MuditaHeader />
      <section className="directory-hero">
        <p className="eyebrow">
          <Sparkles className="icon-xs" aria-hidden="true" />
          Lead magnet directory
        </p>
        <h1>Find a resource worth trading an email for.</h1>
        <p>
          Browse prompt packs, templates, checklists, and workflows that help founders and teams do useful work faster.
        </p>
        <SearchBar
          large
          destination="/promptlibrary/directory"
          initialQuery={query}
          label="Search directory entries"
          placeholder="Search by audience, task, format, or outcome..."
          helperText="Try investor update, content calendar, outbound email, meeting notes, or risk review."
        />
      </section>

      <section className="page-section tight" aria-label="Directory filters">
        <div className="directory-filter-row">
          <Link className={!category ? "quick-chip active" : "quick-chip"} href="/promptlibrary/directory">
            All entries
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              className={category === item ? "quick-chip active" : "quick-chip"}
              href={`/promptlibrary/directory?${new URLSearchParams({ ...(query ? { q: query } : {}), category: item }).toString()}`}
            >
              {item}
            </Link>
          ))}
          {query || category ? (
            <Link className="quick-chip clear" href="/promptlibrary/directory">
              Clear filters
            </Link>
          ) : null}
        </div>
      </section>

      <section className="page-section" aria-labelledby="directory-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{visibleEntries.length} entries</p>
            <h2 id="directory-heading">{query || category ? "Matching resources" : "Featured lead magnets"}</h2>
          </div>
          <Link href="/promptlibrary/search" className="text-link">
            Search prompts instead <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <div className="directory-grid">
          {visibleEntries.map((entry) => (
            <article key={entry.id} className="directory-card">
              <div className="card-topline">
                <span className="category-pill">{entry.category}</span>
                <span className="tested-badge">{entry.format}</span>
                {entry.isTrending ? <span className="locked-badge">Trending</span> : null}
              </div>
              <h3>{entry.title}</h3>
              <p>{entry.summary}</p>
              <p className="directory-description">{entry.description}</p>
              <div className="tag-line">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag-link">
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 ? <span className="tag-more">+{entry.tags.length - 3}</span> : null}
              </div>
              <dl className="directory-meta">
                <div>
                  <dt>Best for</dt>
                  <dd>{entry.audience}</dd>
                </div>
                <div>
                  <dt>You&apos;ll get</dt>
                  <dd>{entry.outcome}</dd>
                </div>
              </dl>
              <div className="card-metrics">
                <span>{entry.copyCount} copies</span>
                <span>{entry.helpfulPercent}% helpful</span>
              </div>
              <Link
                href={entry.ctaUrl}
                className="primary-action fit"
                target={isExternalUrl(entry.ctaUrl) ? "_blank" : undefined}
                rel={isExternalUrl(entry.ctaUrl) ? "noreferrer" : undefined}
              >
                <Search className="icon-sm" aria-hidden="true" />
                {entry.ctaLabel}
              </Link>
              <span className="action-note">{entry.proofLabel}</span>
            </article>
          ))}
          {!visibleEntries.length ? (
            <div className="empty-state">
              <h2>No entries found.</h2>
              <p className="muted">Try a broader search like email, launch, meeting, or planning.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
