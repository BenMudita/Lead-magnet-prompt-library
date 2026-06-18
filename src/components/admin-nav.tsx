import Link from "next/link";
import { BarChart3, FileText, Inbox, Library, Tags } from "lucide-react";

export function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <Link href="/admin/prompts">
        <FileText className="icon-sm" aria-hidden="true" />
        Prompts
      </Link>
      <Link href="/admin/entries">
        <Library className="icon-sm" aria-hidden="true" />
        Entries
      </Link>
      <Link href="/admin/reviews">
        <Tags className="icon-sm" aria-hidden="true" />
        Reviews
      </Link>
      <Link href="/admin/use-notes">
        <Inbox className="icon-sm" aria-hidden="true" />
        Use notes
      </Link>
      <Link href="/admin/analytics">
        <BarChart3 className="icon-sm" aria-hidden="true" />
        Analytics
      </Link>
    </nav>
  );
}
