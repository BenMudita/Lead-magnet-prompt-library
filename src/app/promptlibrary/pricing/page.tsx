import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { MuditaHeader } from "@/components/mudita-header";
import { getSession } from "@/lib/session";
import { recordAnalyticsEvent } from "@/lib/store";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function PricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();
  recordAnalyticsEvent({
    eventName: "free_access_page_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { accountStatus: session.accountStatus },
  });
  const redirect = params.redirect?.startsWith("/") ? params.redirect : "/promptlibrary";
  const signupHref = `/promptlibrary/signup?redirect=${encodeURIComponent(redirect)}`;

  return (
    <main>
      <MuditaHeader />
      <section className="pricing-hero">
        <div>
          <p className="eyebrow">
            <Sparkles className="icon-xs" aria-hidden="true" />
            Free account
          </p>
          <h1>The full Mudita Prompt Library is free to use.</h1>
          <p>Enter your email once, create an account, and copy any prompt. No checkout, no subscription, no payment wall.</p>
        </div>
        <div className="price-card">
          <span className="price-kicker">Library access</span>
          <strong>Free</strong>
          <span>All prompt bodies unlock after email signup.</span>
          <Link href={session.accountStatus === "guest" ? signupHref : redirect} className="primary-action fit">
            {session.accountStatus === "guest" ? "Create free account" : "Return to library"}
            <ArrowRight className="icon-sm" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="page-section" aria-labelledby="unlock-heading">
        <div className="section-heading">
          <h2 id="unlock-heading">What your free account unlocks</h2>
        </div>
        <ul className="feature-list">
          {[
            "All 108 launch prompts and future weekly additions",
            "Full prompt bodies and one-click copy",
            "Send-to-ChatGPT and Send-to-Claude copy/open fallback",
            "Mudita-tested prompts and practical use notes",
            "Full search across categories, tags, explanation, and body",
            "A simple email login so your access follows you",
          ].map((item) => (
            <li key={item}>
              <CheckCircle2 className="icon-sm" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
