"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Category, Prompt, Tag } from "@/lib/types";

export function AdminPromptEditor({
  prompt,
  categories,
  tags,
}: {
  prompt: Prompt;
  categories: Category[];
  tags: Tag[];
}) {
  const [form, setForm] = useState({
    title: prompt.title,
    plainEnglishExplanation: prompt.plainEnglishExplanation,
    body: prompt.body,
    categorySlug: prompt.categorySlug,
    accessLevel: prompt.accessLevel,
    status: prompt.status,
    editorialQualityScore: String(prompt.editorialQualityScore),
    isFeatured: prompt.isFeatured,
    isMuditaTested: prompt.isMuditaTested,
    testingNotes: prompt.testingNotes ?? "",
    tagSlugs: prompt.tagSlugs.join(","),
  });
  const [message, setMessage] = useState("");
  const approvedTags = useMemo(() => tags.filter((tag) => tag.status === "approved"), [tags]);

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function save(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        editorialQualityScore: Number(form.editorialQualityScore),
        tagSlugs: form.tagSlugs
          .split(",")
          .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
          .filter(Boolean),
      }),
    });
    setMessage(response.ok ? "Saved." : "Save failed.");
  }

  async function runAction(action: "publish" | "unpublish" | "generate-tags" | "generate-explanation" | "mark-tested") {
    const response = await fetch(`/api/admin/prompts/${prompt.id}/${action}`, { method: "POST" });
    const payload = (await response.json()) as { message?: string; prompt?: Partial<Prompt> };
    const updatedPrompt = payload.prompt;
    if (updatedPrompt) {
      setForm((current) => ({
        ...current,
        status: updatedPrompt.status ?? current.status,
        plainEnglishExplanation: updatedPrompt.plainEnglishExplanation ?? current.plainEnglishExplanation,
        tagSlugs: updatedPrompt.tagSlugs?.join(",") ?? current.tagSlugs,
        isMuditaTested: updatedPrompt.isMuditaTested ?? current.isMuditaTested,
        testingNotes: updatedPrompt.testingNotes ?? current.testingNotes,
      }));
    }
    setMessage(response.ok ? payload.message ?? "Action complete." : payload.message ?? "Action failed.");
  }

  return (
    <form className="admin-editor" onSubmit={save}>
      <div className="admin-grid-two">
        <label className="field-label">
          Title
          <input value={form.title} onChange={(event) => update("title", event.target.value)} />
        </label>
        <label className="field-label">
          Category
          <select value={form.categorySlug} onChange={(event) => update("categorySlug", event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field-label">
        Plain-English explanation
        <input
          value={form.plainEnglishExplanation}
          onChange={(event) => update("plainEnglishExplanation", event.target.value)}
        />
      </label>
      <label className="field-label">
        Prompt body
        <textarea value={form.body} onChange={(event) => update("body", event.target.value)} rows={12} />
      </label>
      <div className="admin-grid-two">
        <label className="field-label">
          Access
          <select value={form.accessLevel} onChange={(event) => update("accessLevel", event.target.value)}>
            <option value="free">Free sample</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label className="field-label">
          Status
          <select value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <div className="admin-grid-two">
        <label className="field-label">
          Editorial quality score
          <input
            type="number"
            min="0"
            max="100"
            value={form.editorialQualityScore}
            onChange={(event) => update("editorialQualityScore", event.target.value)}
          />
        </label>
        <label className="field-label">
          Reviewed tags
          <input value={form.tagSlugs} onChange={(event) => update("tagSlugs", event.target.value)} />
        </label>
      </div>
      <div className="chip-row compact">
        {approvedTags.slice(0, 18).map((tag) => (
          <button
            type="button"
            key={tag.id}
            className={form.tagSlugs.split(",").includes(tag.slug) ? "chip chip-active" : "chip"}
            onClick={() => {
              const current = new Set(form.tagSlugs.split(",").filter(Boolean));
              if (current.has(tag.slug)) current.delete(tag.slug);
              else current.add(tag.slug);
              update("tagSlugs", Array.from(current).join(","));
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isFeatured}
          onChange={(event) => update("isFeatured", event.target.checked)}
        />
        <span>Feature as a Mudita Pick</span>
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={form.isMuditaTested}
          onChange={(event) => update("isMuditaTested", event.target.checked)}
        />
        <span>Mark Mudita-tested</span>
      </label>
      <label className="field-label">
        Testing notes
        <textarea value={form.testingNotes} onChange={(event) => update("testingNotes", event.target.value)} rows={3} />
      </label>
      <div className="admin-action-row">
        <button type="submit" className="primary-action fit">
          Save
        </button>
        <button type="button" className="secondary-action" onClick={() => runAction("publish")}>
          Publish
        </button>
        <button type="button" className="secondary-action" onClick={() => runAction("unpublish")}>
          Unpublish
        </button>
        <button type="button" className="secondary-action" onClick={() => runAction("generate-tags")}>
          Generate tags
        </button>
        <button type="button" className="secondary-action" onClick={() => runAction("generate-explanation")}>
          Generate explanation
        </button>
        <button type="button" className="secondary-action" onClick={() => runAction("mark-tested")}>
          Mark tested
        </button>
      </div>
      <p className="inline-status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
