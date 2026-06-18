"use client";

import Link from "next/link";
import { Clipboard, LockKeyhole, Sparkles, ThumbsUp } from "lucide-react";
import type { PublicPrompt } from "@/lib/types";
import { useEffect, useState } from "react";

export function PromptCard({ prompt }: { prompt: PublicPrompt }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed" | "locked">("idle");

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

  async function copyPrompt() {
    setStatus("idle");
    if (prompt.isLocked) {
      window.location.href = `/promptlibrary/pricing?redirect=/promptlibrary/p/${prompt.slug}`;
      return;
    }
    const response = await fetch(`/api/promptlibrary/prompts/${prompt.id}/copy`, {
      method: "POST",
    });
    const payload = (await response.json()) as { body?: string; message?: string };

    if (!response.ok || !payload.body) {
      setStatus(response.status === 402 || response.status === 401 ? "locked" : "failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(payload.body);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <article className={prompt.isLocked ? "prompt-card locked" : "prompt-card"}>
      <div className="card-topline">
        <span className="category-pill">{prompt.category.name}</span>
        {prompt.isMuditaTested ? (
          <span className="tested-badge" title="Mudita-tested means a human or approved agent reviewed the output.">
            <Sparkles className="icon-xs" aria-hidden="true" />
            Tested
          </span>
        ) : null}
      </div>
      <Link href={`/promptlibrary/p/${prompt.slug}`} className="card-title" onClick={trackClick}>
        {prompt.title}
      </Link>
      <p className="card-copy">{prompt.plainEnglishExplanation}</p>
      <div className="tag-line">
        {prompt.tags.slice(0, 4).map((tag) => (
          <Link
            key={tag.id}
            href={`/promptlibrary/search?tags=${tag.slug}`}
            className="tag-link"
            onClick={() => {
              void fetch("/api/analytics/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventName: "tag_filter_clicked",
                  properties: { tag: tag.slug, source: "prompt_card" },
                }),
              });
            }}
          >
            {tag.name}
          </Link>
        ))}
        {prompt.tags.length > 4 ? <span className="tag-more">+{prompt.tags.length - 4}</span> : null}
      </div>
      <div className="card-metrics">
        <span>
          <ThumbsUp className="icon-xs" aria-hidden="true" />
          {Math.round(prompt.helpfulRatio * 100)}% helpful
        </span>
        <span>{prompt.metric.copyCount + prompt.metric.sendChatgptCount + prompt.metric.sendClaudeCount} uses</span>
      </div>
      <div className="card-actions">
        <button type="button" onClick={copyPrompt} className="icon-button text-button" aria-label={`Copy ${prompt.title}`}>
          {prompt.isLocked ? <LockKeyhole className="icon-sm" /> : <Clipboard className="icon-sm" />}
          {prompt.isLocked ? "Locked" : "Copy"}
        </button>
        <Link className="text-link" href={`/promptlibrary/p/${prompt.slug}`} onClick={trackClick}>
          Open
        </Link>
      </div>
      <div className="sr-status" aria-live="polite">
        {status === "copied" ? "Prompt copied." : null}
        {status === "failed" ? "Copy failed. Open the prompt and copy manually." : null}
        {status === "locked" ? prompt.accessMessage : null}
      </div>
      {status === "copied" || status === "failed" || status === "locked" ? (
        <p className={status === "copied" ? "action-note success" : "action-note"}>{status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : prompt.accessMessage}</p>
      ) : null}
    </article>
  );
}
