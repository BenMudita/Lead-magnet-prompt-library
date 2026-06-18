import Link from "next/link";
import { redirect } from "next/navigation";
import { MuditaHeader } from "@/components/mudita-header";
import { getSession } from "@/lib/session";

export default async function AccountPage() {
  const session = await getSession();
  if (session.accountStatus === "guest") {
    redirect("/promptlibrary");
  }

  return (
    <main>
      <MuditaHeader />
      <section className="account-page">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{session.email ?? "Library member"}</h1>
          <p>
            Library access: <strong>email-unlocked prompt access</strong>
          </p>
        </div>
        <div className="account-actions">
          <Link href="/promptlibrary#prompt-library" className="primary-action fit">
            Go to prompt library
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
