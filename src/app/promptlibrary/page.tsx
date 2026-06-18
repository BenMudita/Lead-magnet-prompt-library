import Link from "next/link";
import { ArrowRight, Flame, MessageSquare, Sparkles } from "lucide-react";
import { LibraryHero } from "@/components/library-hero";
import { MuditaHeader } from "@/components/mudita-header";
import { PromptGrid } from "@/components/prompt-grid";
import { CategoryIcon } from "@/components/category-icon";
import {
  categoryStats,
  communityActivity,
  copiesThisWeek,
  homepagePicks,
  homepageRoleSlugs,
  homepageTrending,
} from "@/lib/library";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

export default async function PromptLibraryHome() {
  const session = await getSession();
  const stats = categoryStats();
  const roleStats = homepageRoleSlugs
    .map((slug) => stats.find((item) => item.category.slug === slug))
    .filter((item): item is (typeof stats)[number] => Boolean(item));
  const trending = homepageTrending(session);
  const picks = homepagePicks(session);
  const activity = communityActivity(session);
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

      <section className="page-section" aria-labelledby="trending-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow orange">
              <Flame className="icon-xs" aria-hidden="true" />
              Trending this week
            </p>
            <h2 id="trending-heading">Prompts people are copying right now.</h2>
          </div>
          <Link href="/promptlibrary/search?sort=used" className="text-link">
            See all trending <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <div className="trending-grid">
          {trending.map((prompt, index) => (
            <Link href={`/promptlibrary/p/${prompt.slug}`} className="trending-card" key={prompt.id}>
              <span className="trend-rank">#{index + 1}</span>
              <span className="category-pill">{prompt.category.name}</span>
              <strong>{prompt.title}</strong>
              <span>{prompt.plainEnglishExplanation}</span>
              <span className="trend-proof">
                +{copiesThisWeek(prompt.metric)} copies this week · {Math.round(prompt.helpfulRatio * 100)}% helpful
              </span>
              <span className="text-link">
                View prompt <ArrowRight className="icon-sm" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-section" aria-labelledby="category-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Browse by role</p>
            <h2 id="category-heading">Choose your function or team.</h2>
          </div>
          <Link href="/promptlibrary/search" className="text-link">
            Browse all <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {roleStats.map(({ category, promptCount, testedCount }) => (
            <Link
              href={`/promptlibrary/${category.slug}`}
              className={`category-tile accent-${category.accent}`}
              key={category.id}
            >
              <CategoryIcon name={category.icon} className="h-6 w-6" />
              <span className="tile-title">{category.name}</span>
              <span className="tile-copy">{category.description}</span>
              <span className="tile-meta">
                {promptCount} prompts · {testedCount} tested · free account to copy
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
            <h2 id="picks-heading">Prompts our team recommends starting with.</h2>
          </div>
          <Link href="/promptlibrary/search" className="text-link">
            Explore the library <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
        <PromptGrid prompts={picks} />
      </section>

      <section className="page-section" aria-labelledby="activity-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <MessageSquare className="icon-xs" aria-hidden="true" />
              Community activity
            </p>
            <h2 id="activity-heading">See how people are using prompts in the real world.</h2>
          </div>
        </div>
        <div className="activity-grid">
          {activity.map(({ note, prompt }) => (
            <Link href={`/promptlibrary/p/${prompt.slug}`} className="activity-card" key={note.id}>
              <span className="category-pill">{prompt.category.name}</span>
              <p>{note.body}</p>
              <span className="activity-meta">
                Recently · {prompt.metric.copyCount} copies · {Math.round(prompt.helpfulRatio * 100)}% helpful
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
