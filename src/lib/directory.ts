import { isSupabaseDatabaseEnabled } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/content";
import {
  createLeadMagnetEntry,
  getLeadMagnetEntries,
  getLeadMagnetEntryById,
  updateLeadMagnetEntry,
} from "@/lib/store";
import type { LeadMagnetEntry, LeadMagnetSearchOptions } from "@/lib/types";

type LeadMagnetRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  audience: string;
  outcome: string;
  format: string;
  tags: string[];
  cta_label: string;
  cta_url: string;
  proof_label: string;
  copy_count: number;
  helpful_percent: number;
  status: LeadMagnetEntry["status"];
  is_featured: boolean;
  is_trending: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const TABLE = "lead_magnet_entries";

const makeId = () => `lead_${Math.random().toString(36).slice(2, 10)}`;

const normalizeTags = (tags: string[] = []) =>
  Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 12);

const buildEntry = (
  input: Pick<LeadMagnetEntry, "title" | "summary" | "category"> & Partial<LeadMagnetEntry>,
): LeadMagnetEntry => {
  const now = new Date().toISOString();
  return {
    id: input.id ?? makeId(),
    title: input.title.trim(),
    slug: slugify(input.slug || input.title),
    summary: input.summary.trim(),
    description: input.description?.trim() || input.summary.trim(),
    category: input.category.trim(),
    audience: input.audience?.trim() || "Founders and operators",
    outcome: input.outcome?.trim() || "A useful first draft",
    format: input.format?.trim() || "Prompt",
    tags: normalizeTags(input.tags),
    ctaLabel: input.ctaLabel?.trim() || "Open resource",
    ctaUrl: input.ctaUrl?.trim() || "/promptlibrary/search",
    proofLabel: input.proofLabel?.trim() || "New resource",
    copyCount: input.copyCount ?? 0,
    helpfulPercent: input.helpfulPercent ?? 80,
    status: input.status ?? "draft",
    isFeatured: input.isFeatured ?? false,
    isTrending: input.isTrending ?? false,
    sortOrder: input.sortOrder ?? 100,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
};

const rowToEntry = (row: LeadMagnetRow): LeadMagnetEntry => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  summary: row.summary,
  description: row.description,
  category: row.category,
  audience: row.audience,
  outcome: row.outcome,
  format: row.format,
  tags: row.tags ?? [],
  ctaLabel: row.cta_label,
  ctaUrl: row.cta_url,
  proofLabel: row.proof_label,
  copyCount: row.copy_count,
  helpfulPercent: row.helpful_percent,
  status: row.status,
  isFeatured: row.is_featured,
  isTrending: row.is_trending,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const entryToRow = (entry: LeadMagnetEntry): LeadMagnetRow => ({
  id: entry.id,
  title: entry.title,
  slug: entry.slug,
  summary: entry.summary,
  description: entry.description,
  category: entry.category,
  audience: entry.audience,
  outcome: entry.outcome,
  format: entry.format,
  tags: entry.tags,
  cta_label: entry.ctaLabel,
  cta_url: entry.ctaUrl,
  proof_label: entry.proofLabel,
  copy_count: entry.copyCount,
  helpful_percent: entry.helpfulPercent,
  status: entry.status,
  is_featured: entry.isFeatured,
  is_trending: entry.isTrending,
  sort_order: entry.sortOrder,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
});

const rowPatchFromEntryPatch = (patch: Partial<LeadMagnetEntry>) => {
  const row: Partial<LeadMagnetRow> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.summary !== undefined) row.summary = patch.summary;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.audience !== undefined) row.audience = patch.audience;
  if (patch.outcome !== undefined) row.outcome = patch.outcome;
  if (patch.format !== undefined) row.format = patch.format;
  if (patch.tags !== undefined) row.tags = patch.tags;
  if (patch.ctaLabel !== undefined) row.cta_label = patch.ctaLabel;
  if (patch.ctaUrl !== undefined) row.cta_url = patch.ctaUrl;
  if (patch.proofLabel !== undefined) row.proof_label = patch.proofLabel;
  if (patch.copyCount !== undefined) row.copy_count = patch.copyCount;
  if (patch.helpfulPercent !== undefined) row.helpful_percent = patch.helpfulPercent;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.isFeatured !== undefined) row.is_featured = patch.isFeatured;
  if (patch.isTrending !== undefined) row.is_trending = patch.isTrending;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  row.updated_at = new Date().toISOString();
  return row;
};

const filterEntries = (entries: LeadMagnetEntry[], options: LeadMagnetSearchOptions = {}) => {
  const query = options.query?.trim().toLowerCase();
  const category = options.category?.trim().toLowerCase();
  const tag = options.tag?.trim().toLowerCase();

  return entries
    .filter((entry) => (options.includeDrafts ? entry.status !== "archived" : entry.status === "published"))
    .filter((entry) => {
      if (!query) return true;
      return [
        entry.title,
        entry.summary,
        entry.description,
        entry.category,
        entry.audience,
        entry.outcome,
        entry.format,
        entry.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((entry) => (category ? entry.category.toLowerCase() === category : true))
    .filter((entry) => (tag ? entry.tags.some((candidate) => candidate.toLowerCase() === tag) : true))
    .sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) ||
        Number(b.isTrending) - Number(a.isTrending) ||
        a.sortOrder - b.sortOrder ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
};

export async function listDirectoryEntries(options: LeadMagnetSearchOptions = {}) {
  if (!isSupabaseDatabaseEnabled()) return getLeadMagnetEntries(options);

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return filterEntries(((data ?? []) as LeadMagnetRow[]).map(rowToEntry), options);
  } catch (error) {
    console.warn("Falling back to seeded lead magnet entries:", error);
    return getLeadMagnetEntries(options);
  }
}

export async function getDirectoryEntryById(id: string, includeDrafts = false) {
  if (!isSupabaseDatabaseEnabled()) return getLeadMagnetEntryById(id, includeDrafts);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const entry = rowToEntry(data as LeadMagnetRow);
  if (!includeDrafts && entry.status !== "published") return undefined;
  return entry;
}

export async function createDirectoryEntry(
  input: Pick<LeadMagnetEntry, "title" | "summary" | "category"> & Partial<LeadMagnetEntry>,
) {
  if (!isSupabaseDatabaseEnabled()) return createLeadMagnetEntry(input);

  const entry = buildEntry(input);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(TABLE).insert(entryToRow(entry)).select("*").single();
  if (error) throw error;
  return rowToEntry(data as LeadMagnetRow);
}

export async function updateDirectoryEntry(id: string, patch: Partial<LeadMagnetEntry>) {
  if (!isSupabaseDatabaseEnabled()) return updateLeadMagnetEntry(id, patch);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(rowPatchFromEntryPatch(patch))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToEntry(data as LeadMagnetRow);
}
