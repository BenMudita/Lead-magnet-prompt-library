"use client";

import { FormEvent, useState } from "react";
import type { LeadMagnetEntry } from "@/lib/types";

export function AdminDirectoryEntryEditor({ entry }: { entry: LeadMagnetEntry }) {
  const [form, setForm] = useState({
    title: entry.title,
    slug: entry.slug,
    summary: entry.summary,
    description: entry.description,
    category: entry.category,
    audience: entry.audience,
    outcome: entry.outcome,
    format: entry.format,
    tags: entry.tags.join(", "),
    ctaLabel: entry.ctaLabel,
    ctaUrl: entry.ctaUrl,
    proofLabel: entry.proofLabel,
    copyCount: String(entry.copyCount),
    helpfulPercent: String(entry.helpfulPercent),
    status: entry.status,
    isFeatured: entry.isFeatured,
    isTrending: entry.isTrending,
    sortOrder: String(entry.sortOrder),
  });
  const [message, setMessage] = useState("");

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const response = await fetch(`/api/admin/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        copyCount: Number(form.copyCount),
        helpfulPercent: Number(form.helpfulPercent),
        sortOrder: Number(form.sortOrder),
      }),
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(response.ok ? "Saved." : payload.message ?? "Save failed.");
  }

  return (
    <form className="admin-editor" onSubmit={save}>
      <div className="admin-grid-two">
        <label className="field-label">
          Title
          <input value={form.title} onChange={(event) => update("title", event.target.value)} />
        </label>
        <label className="field-label">
          Slug
          <input value={form.slug} onChange={(event) => update("slug", event.target.value)} />
        </label>
      </div>
      <label className="field-label">
        Summary
        <input value={form.summary} onChange={(event) => update("summary", event.target.value)} />
      </label>
      <label className="field-label">
        Description
        <textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={4} />
      </label>
      <div className="admin-grid-two">
        <label className="field-label">
          Category
          <input value={form.category} onChange={(event) => update("category", event.target.value)} />
        </label>
        <label className="field-label">
          Format
          <input value={form.format} onChange={(event) => update("format", event.target.value)} />
        </label>
      </div>
      <div className="admin-grid-two">
        <label className="field-label">
          Audience
          <input value={form.audience} onChange={(event) => update("audience", event.target.value)} />
        </label>
        <label className="field-label">
          Outcome
          <input value={form.outcome} onChange={(event) => update("outcome", event.target.value)} />
        </label>
      </div>
      <label className="field-label">
        Tags
        <input value={form.tags} onChange={(event) => update("tags", event.target.value)} />
      </label>
      <div className="admin-grid-two">
        <label className="field-label">
          CTA label
          <input value={form.ctaLabel} onChange={(event) => update("ctaLabel", event.target.value)} />
        </label>
        <label className="field-label">
          CTA URL
          <input value={form.ctaUrl} onChange={(event) => update("ctaUrl", event.target.value)} />
        </label>
      </div>
      <div className="admin-grid-two">
        <label className="field-label">
          Proof label
          <input value={form.proofLabel} onChange={(event) => update("proofLabel", event.target.value)} />
        </label>
        <label className="field-label">
          Status
          <select value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <div className="admin-grid-two">
        <label className="field-label">
          Copy count
          <input
            type="number"
            min="0"
            value={form.copyCount}
            onChange={(event) => update("copyCount", event.target.value)}
          />
        </label>
        <label className="field-label">
          Helpful percent
          <input
            type="number"
            min="0"
            max="100"
            value={form.helpfulPercent}
            onChange={(event) => update("helpfulPercent", event.target.value)}
          />
        </label>
      </div>
      <label className="field-label">
        Sort order
        <input
          type="number"
          value={form.sortOrder}
          onChange={(event) => update("sortOrder", event.target.value)}
        />
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isFeatured}
          onChange={(event) => update("isFeatured", event.target.checked)}
        />
        <span>Feature this entry</span>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isTrending}
          onChange={(event) => update("isTrending", event.target.checked)}
        />
        <span>Show as trending</span>
      </label>
      <div className="admin-action-row">
        <button type="submit" className="primary-action fit">
          Save entry
        </button>
        <button type="button" className="secondary-action" onClick={() => update("status", "published")}>
          Mark published
        </button>
        <button type="button" className="secondary-action" onClick={() => update("status", "draft")}>
          Move to draft
        </button>
      </div>
      <p className="inline-status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}

