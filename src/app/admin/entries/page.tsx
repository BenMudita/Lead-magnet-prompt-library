import Link from "next/link";
import { AdminCreateDirectoryEntry } from "@/components/admin-create-directory-entry";
import { SessionForm } from "@/components/session-form";
import { listDirectoryEntries } from "@/lib/directory";
import { isSupabaseAuthEnabled, isSupabaseDatabaseEnabled } from "@/lib/env";
import { getSession, isAdminRole } from "@/lib/session";

export default async function AdminEntriesPage() {
  const session = await getSession();
  if (!isAdminRole(session.role)) {
    const supabaseAuth = isSupabaseAuthEnabled();
    return (
      <section className="auth-page">
        <div>
          <p className="eyebrow">Admin required</p>
          <h2>
            {supabaseAuth
              ? "Sign in with an admin account to manage directory entries."
              : "Use the admin demo session to manage directory entries."}
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

  const entries = await listDirectoryEntries({ includeDrafts: true });

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{entries.length} backend-editable entries</p>
          <h2>Lead magnet directory</h2>
          <p className="muted">
            {isSupabaseDatabaseEnabled()
              ? "Publishing here writes to Supabase."
              : "Local demo mode is using seeded in-memory entries. Enable DATABASE_PROVIDER=supabase for persistent edits."}
          </p>
        </div>
        <Link className="secondary-action" href="/promptlibrary/directory">
          View public directory
        </Link>
      </div>
      <AdminCreateDirectoryEntry />
      <div className="admin-list">
        {entries.map((entry) => (
          <article key={entry.id} className="admin-row">
            <div>
              <strong>{entry.title}</strong>
              <p>
                {entry.category} · {entry.format} · {entry.status} · {entry.copyCount} copies · {entry.helpfulPercent}%
                helpful
              </p>
            </div>
            <Link className="secondary-action" href={`/admin/entries/${entry.id}`}>
              Edit
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

