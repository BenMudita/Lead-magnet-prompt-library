import { categories, slugify } from "./content";
import { isSupabaseDatabaseEnabled } from "./env";
import {
  addUseNote as addDemoUseNote,
  createPrompt as createDemoPrompt,
  getMetric as getDemoMetric,
  getPromptById as getDemoPromptById,
  getPromptBySlug as getDemoPromptBySlug,
  getPrompts as getDemoPrompts,
  getPublicUseNotesForPrompt as getDemoPublicUseNotesForPrompt,
  getTags as getDemoTags,
  getUseNotes as getDemoUseNotes,
  incrementMetric as incrementDemoMetric,
  moderateUseNote as moderateDemoUseNote,
  recordVote as recordDemoVote,
  updatePrompt as updateDemoPrompt,
  upsertTag as upsertDemoTag,
} from "./store";
import { createSupabaseAdminClient } from "./supabase/server";
import type {
  Category,
  Prompt,
  PromptMetric,
  PromptStatus,
  PromptVote,
  Tag,
  TagStatus,
  UseNote,
  UseNoteStatus,
  VoteValue,
} from "./types";

type PromptRow = {
  id: string;
  title: string;
  slug: string;
  body: string;
  plain_english_explanation: string;
  category_id: string;
  access_level: Prompt["accessLevel"];
  status: PromptStatus;
  editorial_quality_score: number;
  is_featured: boolean;
  is_mudita_tested: boolean;
  tested_at: string | null;
  tested_by_user_id: string | null;
  tested_by_type: Prompt["testedByType"] | null;
  testing_notes: string | null;
  source_url: string | null;
  source_notes: string | null;
  created_by_user_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
  status: TagStatus;
  created_at: string;
  updated_at: string;
};

type PromptTagRow = {
  prompt_id: string;
  tag_id: string;
};

type MetricRow = {
  prompt_id: string;
  views_count: number;
  detail_views_count: number;
  copy_count: number;
  send_chatgpt_count: number;
  send_claude_count: number;
  share_count: number;
  helpful_count: number;
  not_helpful_count: number;
  last_used_at: string | null;
  updated_at: string;
};

type VoteRow = {
  id: string;
  prompt_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  vote: VoteValue;
  created_at: string;
};

type UseNoteRow = {
  id: string;
  prompt_id: string;
  user_id: string | null;
  body: string;
  status: UseNoteStatus;
  is_public: boolean;
  is_featured: boolean;
  is_mudita_team_note: boolean;
  moderated_by_user_id: string | null;
  moderated_at: string | null;
  created_at: string;
};

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const nullableUuid = (value?: string) => (value && UUID_RE.test(value) ? value : null);

export const getCategories = (): Category[] =>
  categories.filter((category) => category.isActive);

export const getCategoryBySlug = (slug: string) =>
  categories.find((category) => category.slug === slug);

const getCategoryById = (id: string) =>
  categories.find((category) => category.id === id) ??
  categories.find((category) => category.slug === id);

const defaultMetric = (promptId: string): PromptMetric => ({
  promptId,
  viewsCount: 0,
  detailViewsCount: 0,
  copyCount: 0,
  sendChatgptCount: 0,
  sendClaudeCount: 0,
  shareCount: 0,
  helpfulCount: 0,
  notHelpfulCount: 0,
  updatedAt: now(),
});

const rowToTag = (row: TagRow): Tag => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToMetric = (row: MetricRow): PromptMetric => ({
  promptId: row.prompt_id,
  viewsCount: row.views_count,
  detailViewsCount: row.detail_views_count,
  copyCount: row.copy_count,
  sendChatgptCount: row.send_chatgpt_count,
  sendClaudeCount: row.send_claude_count,
  shareCount: row.share_count,
  helpfulCount: row.helpful_count,
  notHelpfulCount: row.not_helpful_count,
  lastUsedAt: row.last_used_at ?? undefined,
  updatedAt: row.updated_at,
});

const metricToRow = (metric: PromptMetric): MetricRow => ({
  prompt_id: metric.promptId,
  views_count: metric.viewsCount,
  detail_views_count: metric.detailViewsCount,
  copy_count: metric.copyCount,
  send_chatgpt_count: metric.sendChatgptCount,
  send_claude_count: metric.sendClaudeCount,
  share_count: metric.shareCount,
  helpful_count: metric.helpfulCount,
  not_helpful_count: metric.notHelpfulCount,
  last_used_at: metric.lastUsedAt ?? null,
  updated_at: metric.updatedAt,
});

const rowToPrompt = (row: PromptRow, tagSlugs: string[] = []): Prompt => {
  const category = getCategoryById(row.category_id);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    plainEnglishExplanation: row.plain_english_explanation,
    categoryId: row.category_id,
    categorySlug: category?.slug ?? row.category_id,
    tagSlugs,
    accessLevel: row.access_level,
    status: row.status,
    editorialQualityScore: row.editorial_quality_score,
    isFeatured: row.is_featured,
    isMuditaTested: row.is_mudita_tested,
    testedAt: row.tested_at ?? undefined,
    testedByUserId: row.tested_by_user_id ?? undefined,
    testedByType: row.tested_by_type ?? undefined,
    testingNotes: row.testing_notes ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceNotes: row.source_notes ?? undefined,
    createdByUserId: row.created_by_user_id ?? undefined,
    publishedAt: row.published_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const promptToRow = (prompt: Prompt): PromptRow => ({
  id: prompt.id,
  title: prompt.title,
  slug: prompt.slug,
  body: prompt.body,
  plain_english_explanation: prompt.plainEnglishExplanation,
  category_id: prompt.categoryId,
  access_level: prompt.accessLevel,
  status: prompt.status,
  editorial_quality_score: prompt.editorialQualityScore,
  is_featured: prompt.isFeatured,
  is_mudita_tested: prompt.isMuditaTested,
  tested_at: prompt.testedAt ?? null,
  tested_by_user_id: nullableUuid(prompt.testedByUserId),
  tested_by_type: prompt.testedByType ?? null,
  testing_notes: prompt.testingNotes ?? null,
  source_url: prompt.sourceUrl ?? null,
  source_notes: prompt.sourceNotes ?? null,
  created_by_user_id: nullableUuid(prompt.createdByUserId),
  published_at: prompt.publishedAt ?? null,
  created_at: prompt.createdAt,
  updated_at: prompt.updatedAt,
});

const rowPatchFromPromptPatch = (patch: Partial<Prompt>) => {
  const row: Partial<PromptRow> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.body !== undefined) row.body = patch.body;
  if (patch.plainEnglishExplanation !== undefined) row.plain_english_explanation = patch.plainEnglishExplanation;
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId;
  if (patch.accessLevel !== undefined) row.access_level = patch.accessLevel;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.editorialQualityScore !== undefined) row.editorial_quality_score = patch.editorialQualityScore;
  if (patch.isFeatured !== undefined) row.is_featured = patch.isFeatured;
  if (patch.isMuditaTested !== undefined) row.is_mudita_tested = patch.isMuditaTested;
  if (patch.testedAt !== undefined) row.tested_at = patch.testedAt ?? null;
  if (patch.testedByUserId !== undefined) row.tested_by_user_id = nullableUuid(patch.testedByUserId);
  if (patch.testedByType !== undefined) row.tested_by_type = patch.testedByType ?? null;
  if (patch.testingNotes !== undefined) row.testing_notes = patch.testingNotes ?? null;
  if (patch.sourceUrl !== undefined) row.source_url = patch.sourceUrl ?? null;
  if (patch.sourceNotes !== undefined) row.source_notes = patch.sourceNotes ?? null;
  if (patch.createdByUserId !== undefined) row.created_by_user_id = nullableUuid(patch.createdByUserId);
  if (patch.publishedAt !== undefined) row.published_at = patch.publishedAt ?? null;
  row.updated_at = now();
  return row;
};

const rowToVote = (row: VoteRow): PromptVote => ({
  id: row.id,
  promptId: row.prompt_id,
  userId: row.user_id ?? undefined,
  anonymousId: row.anonymous_id ?? undefined,
  vote: row.vote,
  createdAt: row.created_at,
});

const rowToUseNote = (row: UseNoteRow): UseNote => ({
  id: row.id,
  promptId: row.prompt_id,
  userId: row.user_id ?? undefined,
  body: row.body,
  status: row.status,
  isPublic: row.is_public,
  isFeatured: row.is_featured,
  isMuditaTeamNote: row.is_mudita_team_note,
  moderatedByUserId: row.moderated_by_user_id ?? undefined,
  moderatedAt: row.moderated_at ?? undefined,
  createdAt: row.created_at,
});

async function listTagRows(includeHidden = false) {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("tags").select("*").order("name", { ascending: true });
  if (!includeHidden) query = query.eq("status", "approved");
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TagRow[];
}

export async function getTags(includeHidden = false) {
  if (!isSupabaseDatabaseEnabled()) return getDemoTags(includeHidden);
  try {
    const rows = await listTagRows(includeHidden);
    return rows.map(rowToTag);
  } catch (error) {
    console.warn("Falling back to seeded tags:", error);
    return getDemoTags(includeHidden);
  }
}

export async function upsertTag(name: string, status: TagStatus = "approved") {
  if (!isSupabaseDatabaseEnabled()) return upsertDemoTag(name, status);

  const trimmed = name.trim();
  const tagSlug = slugify(trimmed);
  const timestamp = now();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      {
        id: `tag_${tagSlug}`,
        name: trimmed,
        slug: tagSlug,
        status,
        updated_at: timestamp,
      },
      { onConflict: "slug" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return rowToTag(data as TagRow);
}

async function tagSlugsByPromptId(promptIds: string[]) {
  const map = new Map<string, string[]>();
  if (!promptIds.length) return map;

  const supabase = createSupabaseAdminClient();
  const [{ data: promptTagRows, error: promptTagsError }, tagRows] = await Promise.all([
    supabase.from("prompt_tags").select("prompt_id,tag_id").in("prompt_id", promptIds),
    listTagRows(true),
  ]);
  if (promptTagsError) throw promptTagsError;

  const tagSlugById = new Map(tagRows.map((tag) => [tag.id, tag.slug]));
  ((promptTagRows ?? []) as PromptTagRow[]).forEach((row) => {
    const tagSlug = tagSlugById.get(row.tag_id);
    if (!tagSlug) return;
    const current = map.get(row.prompt_id) ?? [];
    current.push(tagSlug);
    map.set(row.prompt_id, current);
  });
  return map;
}

export async function getPrompts(includeDrafts = false) {
  if (!isSupabaseDatabaseEnabled()) return getDemoPrompts(includeDrafts);

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase.from("prompts").select("*").order("updated_at", { ascending: false });
    if (!includeDrafts) query = query.eq("status", "published");
    else query = query.neq("status", "archived");

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as PromptRow[];
    const tagsByPromptId = await tagSlugsByPromptId(rows.map((row) => row.id));
    return rows.map((row) => rowToPrompt(row, tagsByPromptId.get(row.id) ?? []));
  } catch (error) {
    console.warn("Falling back to seeded prompts:", error);
    return getDemoPrompts(includeDrafts);
  }
}

export async function getPromptById(id: string, includeDrafts = false) {
  if (!isSupabaseDatabaseEnabled()) return getDemoPromptById(id, includeDrafts);

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase.from("prompts").select("*").eq("id", id);
    if (!includeDrafts) query = query.eq("status", "published");
    else query = query.neq("status", "archived");

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return undefined;

    const tagsByPromptId = await tagSlugsByPromptId([id]);
    return rowToPrompt(data as PromptRow, tagsByPromptId.get(id) ?? []);
  } catch (error) {
    console.warn(`Falling back to seeded prompt ${id}:`, error);
    return getDemoPromptById(id, includeDrafts);
  }
}

export async function getPromptBySlug(slug: string, includeDrafts = false) {
  if (!isSupabaseDatabaseEnabled()) return getDemoPromptBySlug(slug, includeDrafts);

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase.from("prompts").select("*").eq("slug", slug);
    if (!includeDrafts) query = query.eq("status", "published");
    else query = query.neq("status", "archived");

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return undefined;

    const row = data as PromptRow;
    const tagsByPromptId = await tagSlugsByPromptId([row.id]);
    return rowToPrompt(row, tagsByPromptId.get(row.id) ?? []);
  } catch (error) {
    console.warn(`Falling back to seeded prompt ${slug}:`, error);
    return getDemoPromptBySlug(slug, includeDrafts);
  }
}

async function uniqueSlug(base: string) {
  let candidate = base;
  let suffix = 2;
  while (await getPromptBySlug(candidate, true)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function setPromptTags(promptId: string, tagSlugs: string[], approvedByUserId?: string) {
  const supabase = createSupabaseAdminClient();
  const normalized = Array.from(new Set(tagSlugs.map(slugify).filter(Boolean))).slice(0, 12);
  const tags = await Promise.all(normalized.map((tagSlug) => upsertTag(tagSlug.replace(/-/g, " "), "approved")));

  const { error: deleteError } = await supabase.from("prompt_tags").delete().eq("prompt_id", promptId);
  if (deleteError) throw deleteError;

  if (!tags.length) return;

  const { error } = await supabase.from("prompt_tags").insert(
    tags.map((tag) => ({
      prompt_id: promptId,
      tag_id: tag.id,
      source: "human",
      approved_by_user_id: nullableUuid(approvedByUserId),
    })),
  );
  if (error) throw error;
}

export async function createPrompt(input: Pick<Prompt, "title" | "body" | "categorySlug"> & Partial<Prompt>) {
  if (!isSupabaseDatabaseEnabled()) return createDemoPrompt(input);

  const category = getCategoryBySlug(input.categorySlug);
  if (!category) throw new Error("Unknown category");
  const timestamp = now();
  const baseSlug = slugify(input.slug || input.title);
  const prompt: Prompt = {
    id: input.id ?? makeId("prompt"),
    title: input.title.trim(),
    slug: await uniqueSlug(baseSlug),
    body: input.body.trim(),
    plainEnglishExplanation:
      input.plainEnglishExplanation?.trim() || "A draft prompt waiting for editor review.",
    categoryId: category.id,
    categorySlug: category.slug,
    tagSlugs: input.tagSlugs?.length ? input.tagSlugs.map(slugify) : category.primaryTags.slice(0, 3).map(slugify),
    accessLevel: input.accessLevel ?? "pro",
    status: input.status ?? "draft",
    editorialQualityScore: input.editorialQualityScore ?? 70,
    isFeatured: input.isFeatured ?? false,
    isMuditaTested: input.isMuditaTested ?? false,
    testedAt: input.testedAt,
    testedByUserId: input.testedByUserId,
    testedByType: input.testedByType,
    testingNotes: input.testingNotes,
    sourceUrl: input.sourceUrl,
    sourceNotes: input.sourceNotes,
    createdByUserId: input.createdByUserId,
    publishedAt: input.publishedAt ?? (input.status === "published" ? timestamp : undefined),
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("prompts").insert(promptToRow(prompt));
  if (error) throw error;
  await setPromptTags(prompt.id, prompt.tagSlugs, input.createdByUserId);
  await supabase.from("prompt_metrics").upsert(metricToRow(defaultMetric(prompt.id)), { onConflict: "prompt_id" });
  return (await getPromptById(prompt.id, true)) ?? prompt;
}

export async function updatePrompt(id: string, patch: Partial<Prompt>) {
  if (!isSupabaseDatabaseEnabled()) return updateDemoPrompt(id, patch);

  const category = patch.categorySlug ? getCategoryBySlug(patch.categorySlug) : undefined;
  const rowPatch = rowPatchFromPromptPatch({
    ...patch,
    categoryId: category?.id ?? patch.categoryId,
  });
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("prompts").update(rowPatch).eq("id", id);
  if (error) throw error;

  if (patch.tagSlugs) await setPromptTags(id, patch.tagSlugs, patch.createdByUserId);
  return getPromptById(id, true);
}

export async function getMetrics(promptIds: string[]) {
  const uniqueIds = Array.from(new Set(promptIds));
  const metrics = new Map<string, PromptMetric>();
  if (!uniqueIds.length) return metrics;

  if (!isSupabaseDatabaseEnabled()) {
    uniqueIds.forEach((id) => metrics.set(id, getDemoMetric(id)));
    return metrics;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("prompt_metrics").select("*").in("prompt_id", uniqueIds);
    if (error) throw error;
    ((data ?? []) as MetricRow[]).forEach((row) => metrics.set(row.prompt_id, rowToMetric(row)));
    uniqueIds.forEach((id) => {
      if (!metrics.has(id)) metrics.set(id, defaultMetric(id));
    });
    return metrics;
  } catch (error) {
    console.warn("Falling back to seeded prompt metrics:", error);
    uniqueIds.forEach((id) => metrics.set(id, getDemoMetric(id)));
    return metrics;
  }
}

export async function getMetric(promptId: string) {
  if (!isSupabaseDatabaseEnabled()) return getDemoMetric(promptId);
  const metrics = await getMetrics([promptId]);
  return metrics.get(promptId) ?? defaultMetric(promptId);
}

export async function incrementMetric(
  promptId: string,
  field:
    | "viewsCount"
    | "detailViewsCount"
    | "copyCount"
    | "sendChatgptCount"
    | "sendClaudeCount"
    | "shareCount",
) {
  if (!isSupabaseDatabaseEnabled()) return incrementDemoMetric(promptId, field);

  try {
    const metric = await getMetric(promptId);
    const updated: PromptMetric = {
      ...metric,
      [field]: metric[field] + 1,
      lastUsedAt: now(),
      updatedAt: now(),
    };
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("prompt_metrics").upsert(metricToRow(updated), { onConflict: "prompt_id" });
    if (error) throw error;
    return updated;
  } catch (error) {
    console.warn(`Falling back to seeded metric increment for ${promptId}:`, error);
    return incrementDemoMetric(promptId, field);
  }
}

export async function recordVote({
  promptId,
  userId,
  anonymousId,
  vote,
}: {
  promptId: string;
  userId?: string;
  anonymousId: string;
  vote: VoteValue;
}) {
  if (!isSupabaseDatabaseEnabled()) return recordDemoVote({ promptId, userId, anonymousId, vote });

  const supabase = createSupabaseAdminClient();
  const voterUserId = nullableUuid(userId);
  let query = supabase.from("prompt_votes").select("*").eq("prompt_id", promptId);
  query = voterUserId ? query.eq("user_id", voterUserId) : query.eq("anonymous_id", anonymousId);
  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) throw existingError;

  const metric = await getMetric(promptId);
  const updatedMetric = { ...metric, updatedAt: now() };
  const existingVote = existing ? rowToVote(existing as VoteRow) : undefined;

  if (existingVote?.vote !== vote) {
    if (existingVote?.vote === "helpful") updatedMetric.helpfulCount = Math.max(0, updatedMetric.helpfulCount - 1);
    if (existingVote?.vote === "not_helpful") {
      updatedMetric.notHelpfulCount = Math.max(0, updatedMetric.notHelpfulCount - 1);
    }
    if (vote === "helpful") updatedMetric.helpfulCount += 1;
    if (vote === "not_helpful") updatedMetric.notHelpfulCount += 1;
  }

  const voteRow = {
    id: existingVote?.id ?? makeId("vote"),
    prompt_id: promptId,
    user_id: voterUserId,
    anonymous_id: voterUserId ? null : anonymousId,
    vote,
    created_at: now(),
  };
  const { data, error } = await supabase.from("prompt_votes").upsert(voteRow, { onConflict: "id" }).select("*").single();
  if (error) throw error;
  await supabase.from("prompt_metrics").upsert(metricToRow(updatedMetric), { onConflict: "prompt_id" });
  return rowToVote(data as VoteRow);
}

export async function addUseNote({
  promptId,
  userId,
  body,
}: {
  promptId: string;
  userId?: string;
  body: string;
}) {
  if (!isSupabaseDatabaseEnabled()) return addDemoUseNote({ promptId, userId, body });

  const sanitized = body.replace(/<[^>]+>/g, "").trim().slice(0, 280);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("use_notes")
    .insert({
      id: makeId("note"),
      prompt_id: promptId,
      user_id: nullableUuid(userId),
      body: sanitized,
      status: "pending",
      is_public: false,
      is_featured: false,
      is_mudita_team_note: false,
      created_at: now(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToUseNote(data as UseNoteRow);
}

export async function getUseNotes(status?: UseNoteStatus) {
  if (!isSupabaseDatabaseEnabled()) return getDemoUseNotes(status);

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase.from("use_notes").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as UseNoteRow[]).map(rowToUseNote);
  } catch (error) {
    console.warn("Falling back to seeded use notes:", error);
    return getDemoUseNotes(status);
  }
}

export async function getPublicUseNotesForPrompt(promptId: string) {
  if (!isSupabaseDatabaseEnabled()) return getDemoPublicUseNotesForPrompt(promptId);

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("use_notes")
      .select("*")
      .eq("prompt_id", promptId)
      .eq("status", "approved")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as UseNoteRow[]).map(rowToUseNote);
  } catch (error) {
    console.warn(`Falling back to seeded use notes for prompt ${promptId}:`, error);
    return getDemoPublicUseNotesForPrompt(promptId);
  }
}

export async function moderateUseNote({
  id,
  status,
  moderatorUserId,
  body,
  isFeatured,
  isMuditaTeamNote,
}: {
  id: string;
  status: UseNoteStatus;
  moderatorUserId: string;
  body?: string;
  isFeatured?: boolean;
  isMuditaTeamNote?: boolean;
}) {
  if (!isSupabaseDatabaseEnabled()) {
    return moderateDemoUseNote({ id, status, moderatorUserId, body, isFeatured, isMuditaTeamNote });
  }

  const patch: Partial<UseNoteRow> = {
    status,
    is_public: status === "approved",
    moderated_by_user_id: nullableUuid(moderatorUserId),
    moderated_at: now(),
  };
  if (typeof body === "string") patch.body = body.replace(/<[^>]+>/g, "").trim().slice(0, 280);
  if (typeof isFeatured === "boolean") patch.is_featured = isFeatured;
  if (typeof isMuditaTeamNote === "boolean") patch.is_mudita_team_note = isMuditaTeamNote;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("use_notes").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return rowToUseNote(data as UseNoteRow);
}
