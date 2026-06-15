import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { CheckoutButton } from "@/components/checkout-button";
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
    eventName: "paywall_viewed",
    anonymousId: session.anonymousId,
    userId: session.userId,
    properties: { accountStatus: session.accountStatus },
  });

  return (
    <main>
      <MuditaHeader />
      <section className="pricing-hero">
        <div>
          <p className="eyebrow">
            <Sparkles className="icon-xs" aria-hidden="true" />
            Founding member offer
          </p>
          <h1>Unlock the full Mudita Prompt Library</h1>
          <p>Full library, full search, tested prompts, practical use notes, and new curated additions as content operations come online.</p>
        </div>
        <div className="price-card">
          <span className="price-kicker">First 500 members</span>
          <strong>$49/year</strong>
          <span>$4.08/month equivalent, billed annually</span>
          <CheckoutButton redirect={params.redirect ?? "/promptlibrary"} />
          <Link href="/promptlibrary/signup" className="text-link">
            Start with a free account
          </Link>
        </div>
      </section>
      <section className="page-section" aria-labelledby="unlock-heading">
        <div className="section-heading">
          <h2 id="unlock-heading">What Pro unlocks</h2>
        </div>
        <ul className="feature-list">
          {[
            "All 108 launch prompts and future weekly additions",
            "Full premium prompt bodies and one-click copy",
            "Send-to-ChatGPT and Send-to-Claude copy/open fallback",
            "Mudita-tested prompts and practical use notes",
            "Full search across categories, tags, explanation, and body",
            "Simple annual plan ready to connect to Stripe Checkout",
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
