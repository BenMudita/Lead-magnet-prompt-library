"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCreateDirectoryEntry() {
  const [title, setTitle] = useState("New lead magnet entry");
  const [category, setCategory] = useState("Founder");
  const [summary, setSummary] = useState("A concise resource people can open, preview, and use right away.");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, summary }),
    });
    const payload = (await response.json()) as { id?: string; message?: string };
    if (response.ok && payload.id) {
      router.push(`/admin/entries/${payload.id}`);
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
      <div className="admin-grid-two">
        <label className="field-label">
          Category
          <input value={category} onChange={(event) => setCategory(event.target.value)} />
        </label>
        <label className="field-label">
          Summary
          <input value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
      </div>
      <button type="submit" className="primary-action fit">
        Create entry
      </button>
      <p className="inline-status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}

