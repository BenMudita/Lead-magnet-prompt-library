"use client";

import { useState } from "react";
import type { UseNote } from "@/lib/types";

export function AdminUseNoteList({ notes }: { notes: UseNote[] }) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [message, setMessage] = useState("");

  async function moderate(id: string, status: "approved" | "rejected") {
    const response = await fetch(`/api/admin/use-notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setLocalNotes((current) => current.map((note) => (note.id === id ? { ...note, status, isPublic: status === "approved" } : note)));
      setMessage(status === "approved" ? "Use note approved." : "Use note rejected.");
    } else {
      setMessage("Moderation failed.");
    }
  }

  return (
    <div className="admin-list">
      {localNotes.map((note) => (
        <article key={note.id} className="admin-row">
          <div>
            <strong>{note.status}</strong>
            <p>{note.body}</p>
            <span className="muted">{note.promptId}</span>
          </div>
          <div className="admin-action-row">
            <button type="button" className="secondary-action" onClick={() => moderate(note.id, "approved")}>
              Approve
            </button>
            <button type="button" className="secondary-action" onClick={() => moderate(note.id, "rejected")}>
              Reject
            </button>
          </div>
        </article>
      ))}
      <p className="inline-status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

