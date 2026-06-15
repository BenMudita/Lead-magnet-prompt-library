import { notFound } from "next/navigation";
import { AdminPromptEditor } from "@/components/admin-prompt-editor";
import { SessionForm } from "@/components/session-form";
import { getSession, isAdminRole } from "@/lib/session";
import { getCategories, getPromptById, getTags } from "@/lib/store";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminPromptEditPage({ params }: Props) {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>Use the admin demo session to edit prompts.</h2>
        </div>
        <SessionForm mode="login" admin defaultEmail="admin@muditastudios.com" />
      </section>
    );
  }

  const { id } = await params;
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

