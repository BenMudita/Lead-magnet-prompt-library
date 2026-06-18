import Link from "next/link";
import { notFound } from "next/navigation";
import { LockKeyhole, Sparkles } from "lucide-react";
import { FeedbackPanel } from "@/components/feedback-panel";
import { MuditaHeader } from "@/components/mudita-header";
import { PromptActions } from "@/components/prompt-actions";
import { PromptGrid } from "@/components/prompt-grid";
import { getSession } from "@/lib/session";
import { getPromptBySlug, incrementMetric, recordAnalyticsEvent } from "@/lib/store";
import { promptUseNotes, promptValueGuide, relatedPrompts, toPublicPrompt, updatedLabel, voteCount } from "@/lib/library";

type Props = {
  params: Promise<{ promptSlug: string }>;
};

export default async function PromptDetailPage({ params }: Props) {
  const { promptSlug } = await params;
  const session = await getSession();
  const prompt = getPromptBySlug(promptSlug);
  if (!prompt) notFound();

  incrementMetric(prompt.id, "detailViewsCount");
  recordAnalyticsEvent({
    eventName: "prompt_detail_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { promptId: prompt.id, promptSlug: prompt.slug, accountStatus: session.accountStatus },
  });

  const publicPrompt = toPublicPrompt(prompt, session);
  const valueGuide = promptValueGuide(prompt);
  const notes = promptUseNotes(prompt.id);
  const related = relatedPrompts(prompt, session);
  const totalVotes = voteCount(publicPrompt.metric);

  return (
    <main>
      <MuditaHeader />
      <article className="prompt-detail">
        <div className="detail-kicker">
          <Link href={`/promptlibrary/${publicPrompt.category.slug}`} className="category-pill">
            {publicPrompt.category.name}
          </Link>
          {publicPrompt.isMuditaTested ? (
            <span className="tested-badge">
              <Sparkles className="icon-xs" aria-hidden="true" />
              Mudita-tested
            </span>
          ) : null}
          {publicPrompt.isLocked ? (
            <span className="locked-badge">
              <LockKeyhole className="icon-xs" aria-hidden="true" />
              Free account
            </span>
          ) : null}
        </div>
        <h1>{publicPrompt.title}</h1>
        <p className="detail-summary">{publicPrompt.plainEnglishExplanation}</p>
        <div className="detail-proof-row" aria-label="Prompt proof">
          <span>{publicPrompt.metric.copyCount} copies</span>
          <span>{Math.round(publicPrompt.helpfulRatio * 100)}% helpful{totalVotes ? ` based on ${totalVotes} votes` : ""}</span>
          <span>{updatedLabel(publicPrompt.metric.updatedAt)}</span>
        </div>
        <div className="tag-line detail-tags">
          {publicPrompt.tags.map((tag) => (
            <Link href={`/promptlibrary/search?tags=${tag.slug}`} className="tag-link" key={tag.id}>
              {tag.name}
            </Link>
          ))}
        </div>
        <section className="value-preview-grid" aria-label="Prompt value preview">
          <div>
            <h2>What this prompt helps with</h2>
            <ul>
              {valueGuide.helpsWith.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Best for</h2>
            <ul>
              {valueGuide.bestFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>You&apos;ll get</h2>
            <ul>
              {valueGuide.youllGet.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <PromptActions promptId={publicPrompt.id} promptSlug={publicPrompt.slug} isLocked={publicPrompt.isLocked} />
        <section className={publicPrompt.isLocked ? "prompt-body locked-body" : "prompt-body"} aria-label="Prompt body">
          {publicPrompt.body ? (
            <pre>{publicPrompt.body}</pre>
          ) : (
            <>
              <p>{publicPrompt.bodyPreview}</p>
              <div className="paywall-inline">
                <LockKeyhole className="icon-sm" aria-hidden="true" />
                <span>{publicPrompt.accessMessage}</span>
                <Link
                  href={`/promptlibrary/signup?redirect=${encodeURIComponent(`/promptlibrary/p/${publicPrompt.slug}`)}`}
                  className="primary-action fit"
                >
                  Create free account to copy this prompt
                </Link>
              </div>
            </>
          )}
        </section>
      </article>

      <section className="page-section" aria-labelledby="usage-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community notes</p>
            <h2 id="usage-heading">How people are using this prompt</h2>
          </div>
        </div>
        <div className="use-note-list">
          {notes.length ? (
            notes.map((note) => (
              <blockquote key={note.id} className={note.isFeatured ? "use-note featured" : "use-note"}>
                <p>{note.body}</p>
                <footer>
                  {note.isMuditaTeamNote ? "Mudita team note" : "Library member"} · Recently · {publicPrompt.metric.helpfulCount} helpful votes
                </footer>
              </blockquote>
            ))
          ) : (
            <p className="muted">No public use notes yet. Submitted notes appear after moderation.</p>
          )}
        </div>
      </section>

      <section className="page-section">
        <FeedbackPanel promptId={publicPrompt.id} />
      </section>

      <section className="page-section" aria-labelledby="related-heading">
        <div className="section-heading">
          <h2 id="related-heading">Related prompts</h2>
        </div>
        <PromptGrid prompts={related} />
      </section>
    </main>
  );
}
