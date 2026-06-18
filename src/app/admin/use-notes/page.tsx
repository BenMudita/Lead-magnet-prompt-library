import { AdminUseNoteList } from "@/components/admin-use-note-list";
import { SessionForm } from "@/components/session-form";
import { isSupabaseAuthEnabled } from "@/lib/env";
import { getSession, isAdminRole } from "@/lib/session";
import { getUseNotes } from "@/lib/prompt-data";

export default async function AdminUseNotesPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    const supabaseAuth = isSupabaseAuthEnabled();
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Moderator required</p>
          <h2>
            {supabaseAuth
              ? "Sign in with an admin account to moderate use notes."
              : "Use the admin demo session to moderate use notes."}
          </h2>
        </div>
        <SessionForm
          mode="login"
          admin={!supabaseAuth}
          defaultEmail="admin@muditastudios.com"
          redirectTo="/admin/use-notes"
        />
      </section>
    );
  }

  const [allNotes, pendingNotes] = await Promise.all([getUseNotes(), getUseNotes("pending")]);
  const notes = allNotes.slice(0, 80);

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{pendingNotes.length} pending</p>
          <h2>Use note moderation</h2>
        </div>
      </div>
      <AdminUseNoteList notes={notes} />
    </section>
  );
}
