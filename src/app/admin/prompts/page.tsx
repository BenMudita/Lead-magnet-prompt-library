import Link from "next/link";
import { AdminCreatePrompt } from "@/components/admin-create-prompt";
import { SessionForm } from "@/components/session-form";
import { getSession, isAdminRole } from "@/lib/session";
import { getCategories, getPrompts } from "@/lib/store";

export default async function AdminPromptsPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>Use the admin demo session to review the content workflow.</h2>
        </div>
        <SessionForm mode="login" admin defaultEmail="admin@muditastudios.com" />
      </section>
    );
  }

  const prompts = getPrompts(true);

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{prompts.length} editable prompts</p>
          <h2>Prompt management</h2>
        </div>
      </div>
      <AdminCreatePrompt categories={getCategories()} />
      <div className="admin-list">
        {prompts.slice(0, 80).map((prompt) => (
          <article key={prompt.id} className="admin-row">
            <div>
              <strong>{prompt.title}</strong>
              <p>
                {prompt.categorySlug} · {prompt.accessLevel} · {prompt.status} · score {prompt.editorialQualityScore}
              </p>
            </div>
            <Link className="secondary-action" href={`/admin/prompts/${prompt.id}`}>
              Edit
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

