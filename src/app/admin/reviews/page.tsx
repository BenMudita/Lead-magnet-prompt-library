import { SessionForm } from "@/components/session-form";
import { getSession, isAdminRole } from "@/lib/session";
import { getPrompts, getTags } from "@/lib/store";

export default async function AdminReviewsPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>Use the admin demo session to review AI tags and explanations.</h2>
        </div>
        <SessionForm mode="login" admin defaultEmail="admin@muditastudios.com" />
      </section>
    );
  }

  const prompts = getPrompts(true).filter((prompt) => prompt.status === "draft" || prompt.status === "in_review");
  const suggestedTags = getTags(true).filter((tag) => tag.status === "suggested");

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Human review before publish</p>
          <h2>QA queue</h2>
        </div>
      </div>
      <div className="admin-grid-two">
        <div className="admin-panel">
          <h3>Draft or in-review prompts</h3>
          {prompts.length ? (
            prompts.map((prompt) => (
              <p key={prompt.id}>
                {prompt.title} · {prompt.status}
              </p>
            ))
          ) : (
            <p className="muted">No prompts are waiting on prompt QA.</p>
          )}
        </div>
        <div className="admin-panel">
          <h3>Suggested tags</h3>
          {suggestedTags.length ? (
            suggestedTags.map((tag) => <p key={tag.id}>{tag.name}</p>)
          ) : (
            <p className="muted">No suggested tags are pending approval.</p>
          )}
        </div>
      </div>
    </section>
  );
}

