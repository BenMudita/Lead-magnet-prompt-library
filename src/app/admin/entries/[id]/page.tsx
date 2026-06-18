import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDirectoryEntryEditor } from "@/components/admin-directory-entry-editor";
import { SessionForm } from "@/components/session-form";
import { getDirectoryEntryById } from "@/lib/directory";
import { isSupabaseAuthEnabled } from "@/lib/env";
import { getSession, isAdminRole } from "@/lib/session";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEntryPage({ params }: Props) {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    const supabaseAuth = isSupabaseAuthEnabled();
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>
            {supabaseAuth
              ? "Sign in with an admin account to edit this entry."
              : "Use the admin demo session to edit this entry."}
          </h2>
        </div>
        <SessionForm
          mode="login"
          admin={!supabaseAuth}
          defaultEmail="admin@muditastudios.com"
          redirectTo="/admin/entries"
        />
      </section>
    );
  }

  const { id } = await params;
  const entry = await getDirectoryEntryById(id, true);
  if (!entry) notFound();

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Directory entry</p>
          <h2>{entry.title}</h2>
        </div>
        <Link href="/admin/entries" className="secondary-action">
          Back to entries
        </Link>
      </div>
      <AdminDirectoryEntryEditor entry={entry} />
    </section>
  );
}

