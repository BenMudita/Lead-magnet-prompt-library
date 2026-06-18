"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({
  initialQuery = "",
  categorySlug,
  placeholder = "Search prompts",
  label = "Search prompts",
  helperText,
  compact = false,
  large = false,
  destination = "/promptlibrary/search",
}: {
  initialQuery?: string;
  categorySlug?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  compact?: boolean;
  large?: boolean;
  destination?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categorySlug) params.set("category", categorySlug);
    router.push(`${destination}?${params.toString()}`);
  }

  return (
    <form className={`${compact ? "search-form compact" : "search-form"}${large ? " large" : ""}`} onSubmit={onSubmit}>
      <label className="search-label" htmlFor="prompt-search">
        {label}
      </label>
      <div className="search-box">
        <Search className="search-icon" aria-hidden="true" />
        <input
          id="prompt-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" aria-label="Search prompts">
          Search
        </button>
      </div>
      {helperText ? <p className="search-helper">{helperText}</p> : null}
    </form>
  );
}
