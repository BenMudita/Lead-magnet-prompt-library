import Link from "next/link";
import { ArrowRight, Sparkles, ThumbsUp } from "lucide-react";
import { LibraryHero } from "@/components/library-hero";
import { MuditaHeader } from "@/components/mudita-header";
import { SearchBar } from "@/components/search-bar";
import { PromptGrid } from "@/components/prompt-grid";
import { CategoryIcon } from "@/components/category-icon";
import { categoryStats, publicSearch } from "@/lib/library";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export default async function PromptLibraryHome() {
  const session = await getSession();
  const stats = categoryStats();
  const picks = publicSearch({ sort: "recommended" }, session)
    .filter((prompt) => prompt.isFeatured)
    .slice(0, 6);
  const helpful = publicSearch({ sort: "helpful" }, session).slice(0, 6);
  const totals = stats.reduce(
    (memo, item) => ({
      promptCount: memo.promptCount + item.promptCount,
      testedCount: memo.testedCount + item.testedCount,
    }),
    { promptCount: 0, testedCount: 0 },
  );

  recordAnalyticsEvent({
    eventName: "prompt_library_landing_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { accountStatus: session.accountStatus },
  });

  return (
    <main>
      <MuditaHeader />
      <LibraryHero totalPrompts={totals.promptCount} testedPrompts={totals.testedCount} />

      <section className="search-band" aria-labelledby="search-heading">
        <div>
          <h2 id="search-heading">Search if you know what you need</h2>
          <p>Browsing by work area is the best starting point. Search is here when you have a phrase in mind.</p>
        </div>
        <SearchBar placeholder="Try email, hiring, budget, launch, onboarding" />
      </section>

      <section className="page-section" aria-labelledby="category-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow orange">Start here</p>
            <h2 id="category-heading">Choose your industry or function</h2>
          </div>
          <Link href="/promptlibrary/search" className="text-link">
            Browse all <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {stats.map(({ category, promptCount, testedCount }) => (
            <Link
              href={`/promptlibrary/${category.slug}`}
              className={`category-tile accent-${category.accent}`}
              key={category.id}
            >
              <CategoryIcon name={category.icon} className="h-6 w-6" />
              <span className="tile-title">{category.name}</span>
              <span className="tile-copy">{category.description}</span>
              <span className="tile-meta">
                {promptCount} prompts · free account · {testedCount} tested
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-section" aria-labelledby="picks-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <Sparkles className="icon-xs" aria-hidden="true" />
              Mudita Picks
            </p>
            <h2 id="picks-heading">A few strong prompts to try first</h2>
          </div>
          <Link href="/promptlibrary/signup" className="text-link">
            Create a free account <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <PromptGrid prompts={picks} />
      </section>

      <section className="page-section" aria-labelledby="helpful-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <ThumbsUp className="icon-xs" aria-hidden="true" />
              Recently helpful
            </p>
            <h2 id="helpful-heading">Prompts people keep using</h2>
          </div>
        </div>
        <PromptGrid prompts={helpful} />
      </section>
    </main>
  );
}
