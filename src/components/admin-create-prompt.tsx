"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

export function AdminCreatePrompt({ categories }: { categories: Category[] }) {
  const [title, setTitle] = useState("New curated prompt");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "marketing");
  const [body, setBody] = useState("You are helping me with [task]. Ask clarifying questions, then produce a useful first draft.");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, categorySlug, body }),
    });
    const payload = (await response.json()) as { id?: string; message?: string };
    if (response.ok && payload.id) {
      router.push(`/admin/prompts/${payload.id}`);
      router.refresh();
    } else {
      setMessage(payload.message ?? "Create failed.");
    }
  }

  return (
    <form className="admin-create" onSubmit={submit}>
      <label className="field-label">
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field-label">
        Category
        <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Body
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} />
      </label>
      <button type="submit" className="primary-action fit">
        Create draft
      </button>
      <p className="inline-status">{message}</p>
    </form>
  );
}

