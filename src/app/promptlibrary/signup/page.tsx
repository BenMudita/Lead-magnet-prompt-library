import Link from "next/link";
import { SessionForm } from "@/components/session-form";
import { MuditaHeader } from "@/components/mudita-header";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/promptlibrary";

  return (
    <main>
      <MuditaHeader />
      <section className="auth-page">
        <div>
          <p className="eyebrow">Free account</p>
          <h1>Create your Mudita account</h1>
          <p>Enter your email once to unlock the full prompt library. No payment required.</p>
          <Link href="/promptlibrary/login" className="text-link">
            Already have an account?
          </Link>
        </div>
        <SessionForm mode="signup" redirectTo={redirectTo} />
      </section>
    </main>
  );
}
