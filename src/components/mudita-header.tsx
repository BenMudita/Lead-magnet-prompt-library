import Link from "next/link";
import { Library, Search } from "lucide-react";

export function MuditaHeader() {
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
        <Link href="/promptlibrary#prompt-library" className="nav-link nav-strong">
          <Library className="icon-sm" aria-hidden="true" />
          Prompt library
        </Link>
        <Link href="/promptlibrary#library-search" className="nav-link">
          <Search className="icon-sm" aria-hidden="true" />
          Search
        </Link>
      </nav>
    </header>
  );
}
