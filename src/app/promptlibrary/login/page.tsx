import Link from "next/link";
import { SessionForm } from "@/components/session-form";
import { MuditaHeader } from "@/components/mudita-header";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/promptlibrary";

  return (
    <main>
      <MuditaHeader />
      <section className="auth-page">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Log in to Mudita</h1>
          <p>Return to the prompt or category you were trying to use.</p>
          <Link href="/promptlibrary/signup" className="text-link">
            Need a free account?
          </Link>
        </div>
        <SessionForm mode="login" redirectTo={redirectTo} />
      </section>
    </main>
  );
}
