import { AdminUseNoteList } from "@/components/admin-use-note-list";
import { SessionForm } from "@/components/session-form";
import { getSession, isAdminRole } from "@/lib/session";
import { getUseNotes } from "@/lib/store";

export default async function AdminUseNotesPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Moderator required</p>
          <h2>Use the admin demo session to moderate use notes.</h2>
        </div>
        <SessionForm mode="login" admin defaultEmail="admin@muditastudios.com" />
      </section>
    );
  }

  const notes = getUseNotes().slice(0, 80);

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{getUseNotes("pending").length} pending</p>
          <h2>Use note moderation</h2>
        </div>
      </div>
      <AdminUseNoteList notes={notes} />
    </section>
  );
}

