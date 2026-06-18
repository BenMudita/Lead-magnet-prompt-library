"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Category, PromptAccessLevel, PromptStatus } from "@/lib/types";

type ImportResponse = {
  message?: string;
  createdCount?: number;
  errorCount?: number;
  errors?: Array<{ row: number; message: string }>;
};

export function AdminPromptImport({ categories }: { categories: Category[] }) {
  const [content, setContent] = useState("");
  const [defaultCategorySlug, setDefaultCategorySlug] = useState(categories[0]?.slug ?? "marketing");
  const [defaultAccessLevel, setDefaultAccessLevel] = useState<PromptAccessLevel>("pro");
  const [defaultStatus, setDefaultStatus] = useState<PromptStatus>("draft");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ImportResponse["errors"]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setContent(await file.text());
    setMessage(`${file.name} loaded.`);
    setErrors([]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setErrors([]);

    const response = await fetch("/api/admin/prompts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        defaultCategorySlug,
        defaultAccessLevel,
        defaultStatus,
      }),
    });
    const payload = (await response.json()) as ImportResponse;

    setSubmitting(false);
    setMessage(payload.message ?? (response.ok ? "Import complete." : "Import failed."));
    setErrors(payload.errors ?? []);
    if (response.ok && payload.createdCount) router.refresh();
  }

  return (
    <form className="admin-import" onSubmit={submit}>
      <div className="admin-import-head">
        <div>
          <p className="eyebrow">Bulk upload</p>
          <h3>Import prompts</h3>
        </div>
        <label className="secondary-action fit">
          <Upload className="icon-sm" aria-hidden="true" />
          Choose file
          <input className="visually-hidden" type="file" accept=".csv,.json,text/csv,application/json" onChange={readFile} />
        </label>
      </div>
      <div className="admin-grid-two">
        <label className="field-label">
          Default category
          <select value={defaultCategorySlug} onChange={(event) => setDefaultCategorySlug(event.target.value)}>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Default access
          <select
            value={defaultAccessLevel}
            onChange={(event) => setDefaultAccessLevel(event.target.value as PromptAccessLevel)}
          >
            <option value="pro">Email-gated</option>
            <option value="free">Free sample</option>
          </select>
        </label>
      </div>
      <label className="field-label">
        Default status
        <select value={defaultStatus} onChange={(event) => setDefaultStatus(event.target.value as PromptStatus)}>
          <option value="draft">Draft</option>
          <option value="in_review">In review</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label className="field-label">
        CSV or JSON
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          placeholder="title,body,categorySlug,tags,status"
        />
      </label>
      <div className="admin-action-row">
        <button type="submit" className="primary-action fit" disabled={submitting}>
          <FileText className="icon-sm" aria-hidden="true" />
          {submitting ? "Importing..." : "Import prompts"}
        </button>
        <p className="inline-status" aria-live="polite">
          {message}
        </p>
      </div>
      {errors?.length ? (
        <div className="admin-import-errors" aria-label="Import errors">
          {errors.slice(0, 8).map((error) => (
            <p key={`${error.row}-${error.message}`}>
              Row {error.row}: {error.message}
            </p>
          ))}
        </div>
      ) : null}
    </form>
  );
}
