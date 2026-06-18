"use client";

import { useState } from "react";
import { Clipboard, ExternalLink, Share2 } from "lucide-react";

export function PromptActions({
  promptId,
  promptSlug,
  isLocked,
}: {
  promptId: string;
  promptSlug: string;
  isLocked: boolean;
}) {
  const [message, setMessage] = useState("");
  const signupHref = `/promptlibrary/signup?redirect=${encodeURIComponent(`/promptlibrary/p/${promptSlug}`)}`;

  async function loadPromptBody(eventName: "copy" | "chatgpt" | "claude") {
    const response =
      eventName === "copy"
        ? await fetch(`/api/promptlibrary/prompts/${promptId}/copy`, { method: "POST" })
        : await fetch(`/api/promptlibrary/prompts/${promptId}/send-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: eventName }),
          });

    const payload = (await response.json()) as { body?: string; message?: string; redirectUrl?: string; url?: string };
    if (!response.ok || !payload.body) {
      if (payload.redirectUrl) {
        window.location.href = payload.redirectUrl;
        return undefined;
      }
      setMessage(payload.message ?? "This prompt is locked.");
      return undefined;
    }
    return payload.body;
  }

  async function copyPrompt() {
    if (isLocked) {
      window.location.href = signupHref;
      return;
    }
    const body = await loadPromptBody("copy");
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setMessage("Prompt copied.");
    } catch {
      setMessage("Copy failed. Select the prompt text and copy it manually.");
    }
  }

  async function sendTo(provider: "chatgpt" | "claude") {
    if (isLocked) {
      window.location.href = signupHref;
      return;
    }
    const body = await loadPromptBody(provider);
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setMessage(`Prompt copied. Paste it into ${provider === "chatgpt" ? "ChatGPT" : "Claude"}.`);
    } catch {
      setMessage(`Open ${provider === "chatgpt" ? "ChatGPT" : "Claude"} and paste the prompt manually.`);
    }
    window.open(provider === "chatgpt" ? "https://chatgpt.com/" : "https://claude.ai/new", "_blank", "noopener,noreferrer");
  }

  async function sharePrompt() {
    const response = await fetch(`/api/promptlibrary/prompts/${promptId}/share`, { method: "POST" });
    const payload = (await response.json()) as { url?: string; message?: string };
    const url = payload.url ?? `${window.location.origin}/promptlibrary/p/${promptSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Share link copied.");
    } catch {
      setMessage(url);
    }
  }

  return (
    <div className="action-group">
      <button type="button" onClick={copyPrompt} className="primary-action" aria-label="Copy prompt">
        <Clipboard className="icon-sm" aria-hidden="true" />
        {isLocked ? "Create free account to copy this prompt" : "Copy prompt"}
      </button>
      <button type="button" onClick={() => sendTo("chatgpt")} className="secondary-action" aria-label="Send prompt to ChatGPT">
        <ExternalLink className="icon-sm" aria-hidden="true" />
        ChatGPT
      </button>
      <button type="button" onClick={() => sendTo("claude")} className="secondary-action" aria-label="Send prompt to Claude">
        <ExternalLink className="icon-sm" aria-hidden="true" />
        Claude
      </button>
      <button type="button" onClick={sharePrompt} className="secondary-action icon-only" aria-label="Share prompt">
        <Share2 className="icon-sm" aria-hidden="true" />
      </button>
      <p className="inline-status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
