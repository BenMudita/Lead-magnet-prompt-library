"use client";

import Link from "next/link";
import type { Tag } from "@/lib/types";

const toggleValue = (active: string[], value: string) => {
  const next = active.includes(value) ? active.filter((item) => item !== value) : [...active, value];
  return next.join(",");
};

export function FilterChips({
  tags,
  activeTags,
  basePath,
  searchParams,
  fragment,
}: {
  tags: Tag[];
  activeTags: string[];
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  fragment?: string;
}) {
  return (
    <div className="chip-row" aria-label="Tag filters">
      {tags.slice(0, 16).map((tag) => {
        const params = new URLSearchParams();
        Object.entries(searchParams ?? {}).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        const nextTags = toggleValue(activeTags, tag.slug);
        if (nextTags) params.set("tags", nextTags);
        else params.delete("tags");

        return (
          <Link
            key={tag.id}
            className={activeTags.includes(tag.slug) ? "chip chip-active" : "chip"}
            href={`${basePath}${params.toString() ? `?${params.toString()}` : ""}${fragment ? `#${fragment}` : ""}`}
            onClick={() => {
              void fetch("/api/analytics/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventName: "tag_filter_clicked",
                  properties: { tag: tag.slug, active: !activeTags.includes(tag.slug) },
                }),
              });
            }}
          >
            {tag.name}
          </Link>
        );
      })}
    </div>
  );
}
