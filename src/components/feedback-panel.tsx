"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export function FeedbackPanel({ promptId }: { promptId: string }) {
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<"helpful" | "not_helpful" | "">("");
  const [note, setNote] = useState("");

  async function vote(voteValue: "helpful" | "not_helpful") {
    const response = await fetch(`/api/promptlibrary/prompts/${promptId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: voteValue }),
    });
    setSelected(voteValue);
    setMessage(response.ok ? "Thanks. Your vote helps ranking." : "Vote could not be saved.");
  }

  async function submitNote() {
    const response = await fetch(`/api/promptlibrary/prompts/${promptId}/use-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: note }),
    });
    if (response.ok) {
      setMessage("Use note submitted for review.");
      setNote("");
    } else {
      setMessage("Use note could not be saved.");
    }
  }

  return (
    <section className="feedback-panel" aria-labelledby="feedback-heading">
      <div>
        <h2 id="feedback-heading">Used this prompt? Share how you used it.</h2>
        <p>Quick votes and short notes help other people find prompts that actually work.</p>
      </div>
      <div className="vote-row">
        <button
          type="button"
          onClick={() => vote("helpful")}
          className={selected === "helpful" ? "secondary-action selected" : "secondary-action"}
          aria-label="Mark prompt helpful"
        >
          <ThumbsUp className="icon-sm" aria-hidden="true" />
          Helpful
        </button>
        <button
          type="button"
          onClick={() => vote("not_helpful")}
          className={selected === "not_helpful" ? "secondary-action selected" : "secondary-action"}
          aria-label="Mark prompt not helpful"
        >
          <ThumbsDown className="icon-sm" aria-hidden="true" />
          Not helpful
        </button>
      </div>
      <label className="field-label" htmlFor="use-note">
        What did you use this prompt for?
      </label>
      <textarea
        id="use-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={280}
        placeholder="Example: I used it to turn investor notes into a weekly update."
      />
      <button type="button" className="primary-action fit" onClick={submitNote} disabled={!note.trim()}>
        Share how you used it
      </button>
      <p className="inline-status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
