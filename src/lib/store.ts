import { categories, metrics, prompts, seedLeadMagnetEntries, seedUseNotes, slugify, tags } from "./content";
import type {
  AnalyticsEvent,
  LeadMagnetEntry,
  LeadMagnetSearchOptions,
  Prompt,
  PromptMetric,
  PromptVote,
  Tag,
  UseNote,
  UseNoteStatus,
  VoteValue,
} from "./types";

interface StoreState {
  prompts: Prompt[];
  tags: Tag[];
  metrics: PromptMetric[];
  votes: PromptVote[];
  useNotes: UseNote[];
  leadMagnetEntries: LeadMagnetEntry[];
  analyticsEvents: AnalyticsEvent[];
  rateLimits: Map<string, number[]>;
}

const globalForStore = globalThis as unknown as { muditaStore?: StoreState };

export const store =
  globalForStore.muditaStore ??
  (globalForStore.muditaStore = {
    prompts: structuredClone(prompts),
    tags: structuredClone(tags),
    metrics: structuredClone(metrics),
    votes: [],
    useNotes: structuredClone(seedUseNotes),
    leadMagnetEntries: structuredClone(seedLeadMagnetEntries),
    analyticsEvents: [],
    rateLimits: new Map<string, number[]>(),
  });

if (!store.leadMagnetEntries) {
  store.leadMagnetEntries = structuredClone(seedLeadMagnetEntries);
}

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const getCategories = () => categories.filter((category) => category.isActive);

export const getCategoryBySlug = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const getTags = (includeHidden = false) =>
  store.tags.filter((tag) => includeHidden || tag.status === "approved");

export const getTagBySlug = (slug: string) =>
  store.tags.find((tag) => tag.slug === slugify(slug));

export const getPrompts = (includeDrafts = false) =>
  store.prompts.filter((prompt) =>
    includeDrafts ? prompt.status !== "archived" : prompt.status === "published",
  );

export const getPromptBySlug = (slug: string, includeDrafts = false) =>
  getPrompts(includeDrafts).find((prompt) => prompt.slug === slug);

export const getPromptById = (id: string, includeDrafts = false) =>
  getPrompts(includeDrafts).find((prompt) => prompt.id === id);

export const getMetric = (promptId: string) => {
  let metric = store.metrics.find((candidate) => candidate.promptId === promptId);

  if (!metric) {
    metric = {
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
    };
    store.metrics.push(metric);
  }

  return metric;
};

export const incrementMetric = (
  promptId: string,
  field:
    | "viewsCount"
    | "detailViewsCount"
    | "copyCount"
    | "sendChatgptCount"
    | "sendClaudeCount"
    | "shareCount",
) => {
  const metric = getMetric(promptId);
  metric[field] += 1;
  metric.lastUsedAt = now();
  metric.updatedAt = now();
  return metric;
};

export const recordVote = ({
  promptId,
  userId,
  anonymousId,
  vote,
}: {
  promptId: string;
  userId?: string;
  anonymousId: string;
  vote: VoteValue;
}) => {
  const voterKey = userId ?? anonymousId;
  const existing = store.votes.find(
    (candidate) => candidate.promptId === promptId && (candidate.userId ?? candidate.anonymousId) === voterKey,
  );
  const metric = getMetric(promptId);

  if (existing) {
    if (existing.vote !== vote) {
      if (existing.vote === "helpful") metric.helpfulCount = Math.max(0, metric.helpfulCount - 1);
      if (existing.vote === "not_helpful") {
        metric.notHelpfulCount = Math.max(0, metric.notHelpfulCount - 1);
      }
      existing.vote = vote;
      existing.createdAt = now();
      if (vote === "helpful") metric.helpfulCount += 1;
      if (vote === "not_helpful") metric.notHelpfulCount += 1;
    }
    metric.updatedAt = now();
    return existing;
  }

  const created: PromptVote = {
    id: makeId("vote"),
    promptId,
    userId,
    anonymousId,
    vote,
    createdAt: now(),
  };
  store.votes.push(created);
  if (vote === "helpful") metric.helpfulCount += 1;
  if (vote === "not_helpful") metric.notHelpfulCount += 1;
  metric.updatedAt = now();
  return created;
};

export const addUseNote = ({
  promptId,
  userId,
  body,
}: {
  promptId: string;
  userId?: string;
  body: string;
}) => {
  const sanitized = body.replace(/<[^>]+>/g, "").trim().slice(0, 280);
  const note: UseNote = {
    id: makeId("note"),
    promptId,
    userId,
    body: sanitized,
    status: "pending",
    isPublic: false,
    isFeatured: false,
    isMuditaTeamNote: false,
    createdAt: now(),
  };
  store.useNotes.unshift(note);
  return note;
};

export const getUseNotes = (status?: UseNoteStatus) =>
  status ? store.useNotes.filter((note) => note.status === status) : store.useNotes;

export const getPublicUseNotesForPrompt = (promptId: string) =>
  store.useNotes
    .filter((note) => note.promptId === promptId && note.status === "approved" && note.isPublic)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt));

export const moderateUseNote = ({
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
}) => {
  const note = store.useNotes.find((candidate) => candidate.id === id);
  if (!note) return undefined;

  note.status = status;
  note.isPublic = status === "approved";
  note.moderatedByUserId = moderatorUserId;
  note.moderatedAt = now();
  if (typeof body === "string") note.body = body.replace(/<[^>]+>/g, "").trim().slice(0, 280);
  if (typeof isFeatured === "boolean") note.isFeatured = isFeatured;
  if (typeof isMuditaTeamNote === "boolean") note.isMuditaTeamNote = isMuditaTeamNote;
  return note;
};

export const recordAnalyticsEvent = (
  event: Omit<AnalyticsEvent, "id" | "createdAt">,
) => {
  const created: AnalyticsEvent = {
    ...event,
    id: makeId("event"),
    createdAt: now(),
  };
  store.analyticsEvents.unshift(created);
  if (store.analyticsEvents.length > 5000) store.analyticsEvents.pop();
  return created;
};

const normalizeEntryTags = (tags: string[] = []) =>
  Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 12);

const normalizeEntrySlug = (title: string, slug?: string) => slugify(slug || title);

const entrySearchableText = (entry: LeadMagnetEntry) =>
  [
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
    .toLowerCase();

export const getLeadMagnetEntries = (options: LeadMagnetSearchOptions = {}) => {
  const query = options.query?.trim().toLowerCase();
  const category = options.category?.trim().toLowerCase();
  const tag = options.tag?.trim().toLowerCase();

  return store.leadMagnetEntries
    .filter((entry) => (options.includeDrafts ? entry.status !== "archived" : entry.status === "published"))
    .filter((entry) => (query ? entrySearchableText(entry).includes(query) : true))
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

export const getLeadMagnetEntryById = (id: string, includeDrafts = false) =>
  getLeadMagnetEntries({ includeDrafts }).find((entry) => entry.id === id);

export const getLeadMagnetEntryBySlug = (slug: string, includeDrafts = false) =>
  getLeadMagnetEntries({ includeDrafts }).find((entry) => entry.slug === slug);

export const createLeadMagnetEntry = (
  input: Pick<LeadMagnetEntry, "title" | "summary" | "category"> & Partial<LeadMagnetEntry>,
) => {
  const entry: LeadMagnetEntry = {
    id: makeId("lead"),
    title: input.title.trim(),
    slug: normalizeEntrySlug(input.title, input.slug),
    summary: input.summary.trim(),
    description: input.description?.trim() || input.summary.trim(),
    category: input.category.trim(),
    audience: input.audience?.trim() || "Founders and operators",
    outcome: input.outcome?.trim() || "A useful first draft",
    format: input.format?.trim() || "Prompt",
    tags: normalizeEntryTags(input.tags),
    ctaLabel: input.ctaLabel?.trim() || "Open resource",
    ctaUrl: input.ctaUrl?.trim() || "/promptlibrary/search",
    proofLabel: input.proofLabel?.trim() || "New resource",
    copyCount: input.copyCount ?? 0,
    helpfulPercent: input.helpfulPercent ?? 80,
    status: input.status ?? "draft",
    isFeatured: input.isFeatured ?? false,
    isTrending: input.isTrending ?? false,
    sortOrder: input.sortOrder ?? store.leadMagnetEntries.length * 10 + 10,
    createdAt: now(),
    updatedAt: now(),
  };
  store.leadMagnetEntries.unshift(entry);
  return entry;
};

export const updateLeadMagnetEntry = (id: string, patch: Partial<LeadMagnetEntry>) => {
  const entry = store.leadMagnetEntries.find((candidate) => candidate.id === id);
  if (!entry) return undefined;
  Object.assign(entry, {
    ...patch,
    slug: patch.slug || (patch.title ? normalizeEntrySlug(patch.title, entry.slug) : entry.slug),
    tags: patch.tags ? normalizeEntryTags(patch.tags) : entry.tags,
    updatedAt: now(),
  });
  return entry;
};

export const getAnalyticsSummary = () => {
  const eventsByName = store.analyticsEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.eventName] = (acc[event.eventName] ?? 0) + 1;
    return acc;
  }, {});

  const topPrompts = getPrompts()
    .map((prompt) => ({ prompt, metric: getMetric(prompt.id) }))
    .sort(
      (a, b) =>
        b.metric.copyCount +
        b.metric.sendChatgptCount +
        b.metric.sendClaudeCount -
        (a.metric.copyCount + a.metric.sendChatgptCount + a.metric.sendClaudeCount),
    )
    .slice(0, 10);

  const topCategories = getCategories()
    .map((category) => {
      const categoryPrompts = getPrompts().filter((prompt) => prompt.categorySlug === category.slug);
      const copies = categoryPrompts.reduce((sum, prompt) => sum + getMetric(prompt.id).copyCount, 0);
      return { category, copies };
    })
    .sort((a, b) => b.copies - a.copies);

  const searchTerms = store.analyticsEvents
    .filter((event) => event.eventName.includes("search") || event.eventName === "zero_results_viewed")
    .slice(0, 20);

  return {
    eventsByName,
    topPrompts,
    topCategories,
    searchTerms,
    totalPrompts: getPrompts().length,
    publishedPrompts: getPrompts().filter((prompt) => prompt.status === "published").length,
    pendingUseNotes: getUseNotes("pending").length,
  };
};

export const isRateLimited = (key: string, maxHits = 8, windowMs = 60_000) => {
  const cutoff = Date.now() - windowMs;
  const hits = (store.rateLimits.get(key) ?? []).filter((hit) => hit > cutoff);
  hits.push(Date.now());
  store.rateLimits.set(key, hits);
  return hits.length > maxHits;
};

export const updatePrompt = (id: string, patch: Partial<Prompt>) => {
  const prompt = store.prompts.find((candidate) => candidate.id === id);
  if (!prompt) return undefined;
  Object.assign(prompt, patch, { updatedAt: now() });
  return prompt;
};

export const createPrompt = (input: Pick<Prompt, "title" | "body" | "categorySlug"> & Partial<Prompt>) => {
  const category = getCategoryBySlug(input.categorySlug);
  if (!category) throw new Error("Unknown category");
  const slug = slugify(input.title);
  const prompt: Prompt = {
    id: makeId("prompt"),
    title: input.title,
    slug,
    body: input.body,
    plainEnglishExplanation:
      input.plainEnglishExplanation ?? "A draft prompt waiting for editor review.",
    categoryId: category.id,
    categorySlug: category.slug,
    tagSlugs: input.tagSlugs ?? category.primaryTags.slice(0, 3).map(slugify),
    accessLevel: input.accessLevel ?? "pro",
    status: input.status ?? "draft",
    editorialQualityScore: input.editorialQualityScore ?? 70,
    isFeatured: input.isFeatured ?? false,
    isMuditaTested: input.isMuditaTested ?? false,
    createdByUserId: input.createdByUserId ?? "user_mudita_editor",
    createdAt: now(),
    updatedAt: now(),
  };
  store.prompts.unshift(prompt);
  return prompt;
};

export const upsertTag = (name: string, status: Tag["status"] = "approved") => {
  const slug = slugify(name);
  const existing = getTagBySlug(slug);
  if (existing) {
    existing.status = status;
    existing.updatedAt = now();
    return existing;
  }
  const tag: Tag = {
    id: `tag_${slug}`,
    name,
    slug,
    status,
    createdAt: now(),
    updatedAt: now(),
  };
  store.tags.push(tag);
  return tag;
};

export const mergeTag = (fromSlug: string, toSlug: string) => {
  const from = getTagBySlug(fromSlug);
  const to = getTagBySlug(toSlug);
  if (!from || !to) return undefined;
  store.prompts.forEach((prompt) => {
    if (prompt.tagSlugs.includes(from.slug)) {
      prompt.tagSlugs = Array.from(new Set(prompt.tagSlugs.map((slug) => (slug === from.slug ? to.slug : slug))));
      prompt.updatedAt = now();
    }
  });
  from.status = "merged";
  from.updatedAt = now();
  return { from, to };
};
