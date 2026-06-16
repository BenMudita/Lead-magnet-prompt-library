import { notFound } from "next/navigation";
import { AdminPromptEditor } from "@/components/admin-prompt-editor";
import { SessionForm } from "@/components/session-form";
import { isSupabaseAuthEnabled } from "@/lib/env";
import { getSession, isAdminRole } from "@/lib/session";
import { getCategories, getPromptById, getTags } from "@/lib/store";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminPromptEditPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    const supabaseAuth = isSupabaseAuthEnabled();
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>
            {supabaseAuth
              ? "Sign in with an admin account to edit prompts."
              : "Use the admin demo session to edit prompts."}
          </h2>
        </div>
        <SessionForm
          mode="login"
          admin={!supabaseAuth}
          defaultEmail="admin@muditastudios.com"
          redirectTo={`/admin/prompts/${id}`}
        />
      </section>
    );
  }

  const prompt = getPromptById(id, true);
  if (!prompt) notFound();

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Prompt editor</p>
          <h2>{prompt.title}</h2>
        </div>
      </div>
      <AdminPromptEditor prompt={prompt} categories={getCategories()} tags={getTags(true)} />
    </section>
  );
}
