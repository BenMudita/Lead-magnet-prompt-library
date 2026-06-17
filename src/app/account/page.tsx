import Link from "next/link";
import { MuditaHeader } from "@/components/mudita-header";
import { getSession } from "@/lib/session";

export default async function AccountPage() {
  const session = await getSession();

  return (
    <main>
      <MuditaHeader />
      <section className="account-page">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{session.email ?? "Preview visitor"}</h1>
          <p>
            Library access: <strong>{session.accountStatus === "guest" ? "preview" : "full prompt access"}</strong>
          </p>
        </div>
        <div className="account-actions">
          <Link href="/promptlibrary/search" className="primary-action fit">
            Use the library
          </Link>
          <Link href="/admin/prompts" className="secondary-action">
            Admin demo
          </Link>
          <form action="/api/session" method="post">
            <input type="hidden" name="_method" value="delete" />
            <button type="submit" className="secondary-action">
              Logout
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
