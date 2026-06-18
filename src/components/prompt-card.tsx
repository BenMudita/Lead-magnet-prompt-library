"use client";

import Link from "next/link";
import type { PublicPrompt } from "@/lib/types";
import { LockKeyhole, Sparkles } from "lucide-react";
import { useEffect } from "react";

export function PromptCard({ prompt }: { prompt: PublicPrompt }) {
  const votes = prompt.metric.helpfulCount + prompt.metric.notHelpfulCount;
  const helpfulLabel = votes ? `${Math.round(prompt.helpfulRatio * 100)}% helpful` : "Newly added";

  useEffect(() => {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "prompt_card_viewed",
        properties: { promptId: prompt.id, promptSlug: prompt.slug, category: prompt.category.slug },
      }),
    });
  }, [prompt.category.slug, prompt.id, prompt.slug]);

  function trackClick() {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "prompt_card_clicked",
        properties: { promptId: prompt.id, promptSlug: prompt.slug, category: prompt.category.slug },
      }),
    });
  }

  return (
    <Link
      href={`/promptlibrary/p/${prompt.slug}`}
      className={`prompt-card accent-${prompt.category.accent}${prompt.isLocked ? " locked" : ""}`}
      onClick={trackClick}
      aria-label={`View prompt: ${prompt.title}`}
    >
      <div className="card-topline">
        <span className="category-pill">{prompt.category.name}</span>
        {prompt.isMuditaTested ? (
          <span
            className="tested-badge"
            title="Mudita-tested means our team tried this prompt and refined it for clarity, usefulness, and output quality."
          >
            <Sparkles className="icon-xs" aria-hidden="true" />
            Mudita-tested
          </span>
        ) : null}
      </div>
      <span className="card-title">{prompt.title}</span>
      <p className="card-copy">{prompt.plainEnglishExplanation}</p>
      <div className="tag-line">
        {prompt.tags.slice(0, 3).map((tag) => (
          <span key={tag.id} className="tag-link">
            {tag.name}
          </span>
        ))}
        {prompt.tags.length > 3 ? <span className="tag-more">+{prompt.tags.length - 3}</span> : null}
      </div>
      <div className="card-metrics">
        <span>{prompt.metric.copyCount} copies</span>
        <span>{helpfulLabel}</span>
      </div>
      <div className="card-actions">
        <span className="text-link">View prompt</span>
        <span className="lock-copy">
          <LockKeyhole className="icon-xs" aria-hidden="true" />
          Free account to copy
        </span>
      </div>
    </Link>
  );
}
