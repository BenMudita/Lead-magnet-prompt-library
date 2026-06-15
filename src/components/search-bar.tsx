"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({
  initialQuery = "",
  categorySlug,
  placeholder = "Search prompts",
  compact = false,
}: {
  initialQuery?: string;
  categorySlug?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categorySlug) params.set("category", categorySlug);
    router.push(`/promptlibrary/search?${params.toString()}`);
  }

  return (
    <form className={compact ? "search-form compact" : "search-form"} onSubmit={onSubmit}>
      <Search className="search-icon" aria-hidden="true" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button type="submit" aria-label="Search prompts">
        Search
      </button>
    </form>
  );
}

