import type { PublicPrompt } from "@/lib/types";
import { PromptCard } from "./prompt-card";

export function PromptGrid({ prompts }: { prompts: PublicPrompt[] }) {
  if (!prompts.length) {
    return (
      <div className="empty-state">
        <h2>No prompts found</h2>
        <p>Try a broader task like email, planning, launch, or research.</p>
      </div>
    );
  }

  return (
    <div className="prompt-grid">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
