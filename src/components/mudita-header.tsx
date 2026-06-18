import Image from "next/image";
import Link from "next/link";
import { Library, Search } from "lucide-react";

export function MuditaHeader() {
  return (
    <header className="site-header">
      <Link href="/promptlibrary" className="brand-link" aria-label="Mudita Prompt Library home">
        <span className="brand-frame" aria-hidden="true">
          <Image
            className="brand-wordmark"
            src="/brand/mudita-wordmark-white.svg"
            width={180}
            height={66}
            alt=""
            priority
            unoptimized
          />
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
