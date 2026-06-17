import Link from "next/link";

type LibraryHeroProps = {
  totalPrompts: number;
  testedPrompts: number;
  accessValue?: string;
  accessLabel?: string;
  browseHref?: string;
  picksHref?: string;
};

export function LibraryHero({
  totalPrompts,
  testedPrompts,
  accessValue = "Free",
  accessLabel = "account unlock",
  browseHref = "#category-heading",
  picksHref = "#picks-heading",
}: LibraryHeroProps) {
  return (
    <section className="product-hero">
      <div className="hero-copy">
        <p className="eyebrow">The Mudita Prompt Library</p>
        <h1>
          Our prompt library. <span className="hero-title-accent">Test them out</span>
          <span className="hero-period">.</span>
        </h1>
        <p>Prompts we wrote and tested ourselves. Pick the kind of work you do, open one, and paste it straight into ChatGPT or Claude.</p>
        <div className="hero-actions">
          <Link href={browseHref} className="primary-action fit">
            Browse the library
          </Link>
          <Link href={picksHref} className="secondary-action fit">
            See Mudita Picks
          </Link>
        </div>
      </div>
      <div className="hero-panel" aria-label="Library status">
        <div>
          <span className="metric-number metric-yellow">{totalPrompts}</span>
          <span className="metric-label">launch prompts</span>
        </div>
        <div>
          <span className="metric-number metric-green">{accessValue}</span>
          <span className="metric-label">{accessLabel}</span>
        </div>
        <div>
          <span className="metric-number metric-orange">{testedPrompts}</span>
          <span className="metric-label">Mudita-tested</span>
        </div>
      </div>
    </section>
  );
}
