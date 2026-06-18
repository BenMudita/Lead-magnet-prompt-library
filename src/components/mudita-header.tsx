import Link from "next/link";
import { LockKeyhole, Search, ShieldCheck, Sparkles } from "lucide-react";
import { getSession } from "@/lib/session";

export async function MuditaHeader() {
  const session = await getSession();
  const statusLabel =
    session.accountStatus === "pro"
      ? "Pro"
      : session.accountStatus === "free"
        ? "Free"
        : "Preview";

  return (
    <header className="site-header">
      <Link href="/promptlibrary" className="brand-link" aria-label="Mudita Prompt Library home">
        <span className="brand-mark">M</span>
        <span>
          <span className="brand-name">Mudita</span>
          <span className="brand-subtitle">Prompt Library</span>
        </span>
      </Link>
      <nav className="header-nav" aria-label="Primary navigation">
        <Link href="/promptlibrary/search" className="nav-link">
          <Search className="icon-sm" aria-hidden="true" />
          Search
        </Link>
        <Link href="/promptlibrary/pricing" className="nav-link nav-strong">
          <Sparkles className="icon-sm" aria-hidden="true" />
          Pricing
        </Link>
        <Link href="/account" className="nav-link">
          {session.accountStatus === "pro" ? (
            <ShieldCheck className="icon-sm" aria-hidden="true" />
          ) : (
            <LockKeyhole className="icon-sm" aria-hidden="true" />
          )}
          {statusLabel}
        </Link>
      </nav>
    </header>
  );
}

