import Link from "next/link";
import { Library, Search, ShieldCheck, Sparkles } from "lucide-react";
import { getSession } from "@/lib/session";

export async function MuditaHeader() {
  const session = await getSession();
  const isGuest = session.accountStatus === "guest";

  return (
    <header className="site-header">
      <Link href="/promptlibrary" className="brand-link" aria-label="Mudita Prompt Library home">
        <span className="brand-frame" aria-hidden="true">
          <span className="brand-est">Est</span>
          <span className="brand-name">Mudita</span>
          <span className="brand-year">2020</span>
          <span className="brand-rule" />
          <span className="brand-subtitle">Prompt Library</span>
        </span>
      </Link>
      <nav className="header-nav" aria-label="Primary navigation">
        <Link href="/promptlibrary/directory" className="nav-link">
          <Library className="icon-sm" aria-hidden="true" />
          Directory
        </Link>
        <Link href="/promptlibrary/search" className="nav-link">
          <Search className="icon-sm" aria-hidden="true" />
          Search
        </Link>
        <Link href={isGuest ? "/promptlibrary/signup" : "/account"} className="nav-link nav-strong">
          {isGuest ? (
            <Sparkles className="icon-sm" aria-hidden="true" />
          ) : (
            <ShieldCheck className="icon-sm" aria-hidden="true" />
          )}
          {isGuest ? "Join free" : "Account"}
        </Link>
      </nav>
    </header>
  );
}
