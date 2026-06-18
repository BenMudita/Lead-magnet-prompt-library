import Link from "next/link";
import { SessionForm } from "@/components/session-form";
import { MuditaHeader } from "@/components/mudita-header";
import { getPromptBySlug } from "@/lib/prompt-data";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/promptlibrary";
  const promptSlug = redirectTo.match(/^\/promptlibrary\/p\/([^/?#]+)/)?.[1];
  const unlockingPrompt = promptSlug ? await getPromptBySlug(decodeURIComponent(promptSlug)) : undefined;

  return (
    <main>
      <MuditaHeader />
      <section className="auth-page">
        <div>
          <p className="eyebrow">Free account</p>
          <h1>Create your free account</h1>
          <p>Unlock 108 ready-to-use prompts and copy any prompt into ChatGPT or Claude. No payment required.</p>
          {unlockingPrompt ? (
            <div className="unlock-card">
              <span>Unlocking</span>
              <strong>{unlockingPrompt.title}</strong>
              <p>{unlockingPrompt.plainEnglishExplanation}</p>
            </div>
          ) : null}
          <Link href="/promptlibrary/login" className="text-link">
            Already have an account? Sign in
          </Link>
          <p className="reassurance-copy">One email. Instant access.</p>
        </div>
        <SessionForm mode="signup" redirectTo={redirectTo} />
      </section>
    </main>
  );
}
