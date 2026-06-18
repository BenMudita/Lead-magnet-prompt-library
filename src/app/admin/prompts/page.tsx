import Link from "next/link";
import { AdminCreatePrompt } from "@/components/admin-create-prompt";
import { AdminPromptImport } from "@/components/admin-prompt-import";
import { SessionForm } from "@/components/session-form";
import { isSupabaseAuthEnabled } from "@/lib/env";
import { getSession, isAdminRole } from "@/lib/session";
import { getCategories, getPrompts } from "@/lib/prompt-data";

export default async function AdminPromptsPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    const supabaseAuth = isSupabaseAuthEnabled();
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>
            {supabaseAuth
              ? "Sign in with an admin account to review the content workflow."
              : "Use the admin demo session to review the content workflow."}
          </h2>
        </div>
        <SessionForm
          mode="login"
          admin={!supabaseAuth}
          defaultEmail="admin@muditastudios.com"
          redirectTo="/admin/prompts"
        />
      </section>
    );
  }

  const prompts = await getPrompts(true);

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{prompts.length} editable prompts</p>
          <h2>Prompt management</h2>
        </div>
      </div>
      <AdminCreatePrompt categories={getCategories()} />
      <AdminPromptImport categories={getCategories()} />
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
