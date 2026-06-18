import type { Prompt, PromptSearchOptions, PublicPrompt, Session } from "./types";
import {
  getCategories,
  getCategoryBySlug,
  getMetric,
  getPrompts,
  getPublicUseNotesForPrompt,
  getTags,
} from "./store";
import { slugify } from "./content";
import { isAdminRole } from "./session";

export const previewBody = (body: string, length = 360) => {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length).trim()}...` : compact;
};

export const helpfulRatio = (prompt: Prompt) => {
  const metric = getMetric(prompt.id);
  return (metric.helpfulCount + 2) / (metric.helpfulCount + metric.notHelpfulCount + 4);
};

const usageScore = (prompt: Prompt) => {
  const metric = getMetric(prompt.id);
  const usage = metric.copyCount + metric.sendChatgptCount + metric.sendClaudeCount;
  return Math.min(100, Math.log1p(usage) * 18);
};

const freshnessScore = (prompt: Prompt) => {
  const published = prompt.publishedAt ? Date.parse(prompt.publishedAt) : Date.parse(prompt.createdAt);
  const ageDays = Math.max(0, (Date.now() - published) / 86_400_000);
  return Math.max(35, 100 - ageDays * 0.25);
};

export const recommendedScore = (prompt: Prompt) => {
  const metric = getMetric(prompt.id);
  const helpful = helpfulRatio(prompt) * 100;
  const sourceSignal = Math.min(100, metric.shareCount * 3);
  const score =
    prompt.editorialQualityScore * 0.45 +
    helpful * 0.25 +
    usageScore(prompt) * 0.2 +
    sourceSignal * 0.05 +
    freshnessScore(prompt) * 0.05 +
    (prompt.isMuditaTested ? 8 : 0) +
    (prompt.isFeatured ? 12 : 0);

  return Math.round(score * 10) / 10;
};

export const canAccessPrompt = (session: Session, prompt: Prompt) =>
  prompt.accessLevel === "free" ||
  session.accountStatus === "pro" ||
  isAdminRole(session.role);

export const canCopyPrompt = canAccessPrompt;

export const toPublicPrompt = (prompt: Prompt, session: Session): PublicPrompt => {
  const category = getCategoryBySlug(prompt.categorySlug);
  if (!category) throw new Error(`Missing category ${prompt.categorySlug}`);
  const tagList = getTags().filter((tag) => prompt.tagSlugs.includes(tag.slug));
  const canAccess = canAccessPrompt(session, prompt);
  const canCopy = canCopyPrompt(session, prompt);
  const metric = getMetric(prompt.id);

  return {
    id: prompt.id,
    title: prompt.title,
    slug: prompt.slug,
    body: canAccess ? prompt.body : undefined,
    bodyPreview: previewBody(prompt.body),
    plainEnglishExplanation: prompt.plainEnglishExplanation,
    category,
    tags: tagList,
    accessLevel: prompt.accessLevel,
    status: prompt.status,
    recommendedScore: recommendedScore(prompt),
    helpfulRatio: helpfulRatio(prompt),
    isFeatured: prompt.isFeatured,
    isMuditaTested: prompt.isMuditaTested,
    testedAt: prompt.testedAt,
    testingNotes: isAdminRole(session.role) ? prompt.testingNotes : undefined,
    metric,
    isLocked: !canAccess,
    canCopy,
    accessMessage: canAccess
      ? "Available"
      : session.accountStatus === "guest"
        ? "Create a free account to sample prompts, or upgrade for the full library."
        : "Upgrade to Pro to unlock the full prompt body and copy actions.",
  };
};

const searchableText = (prompt: Prompt) => {
  const category = getCategoryBySlug(prompt.categorySlug);
  const tagNames = getTags(true)
    .filter((tag) => prompt.tagSlugs.includes(tag.slug))
    .map((tag) => tag.name)
    .join(" ");
  return [
    prompt.title,
    prompt.plainEnglishExplanation,
    prompt.body,
    category?.name,
    category?.description,
    tagNames,
  ]
    .join(" ")
    .toLowerCase();
};

const textRelevance = (prompt: Prompt, rawQuery?: string) => {
  if (!rawQuery) return 0;
  const query = rawQuery.toLowerCase().trim();
  if (!query) return 0;
  const terms = query.split(/\s+/).filter(Boolean);
  const title = prompt.title.toLowerCase();
  const category = getCategoryBySlug(prompt.categorySlug)?.name.toLowerCase() ?? "";
  const tags = prompt.tagSlugs.join(" ");
  const explanation = prompt.plainEnglishExplanation.toLowerCase();
  const body = prompt.body.toLowerCase();

  return terms.reduce((score, term) => {
    if (title.includes(term)) score += 34;
    if (category.includes(term)) score += 24;
    if (tags.includes(slugify(term))) score += 20;
    if (explanation.includes(term)) score += 14;
    if (body.includes(term)) score += 5;
    return score;
  }, 0);
};

export const searchPrompts = (options: PromptSearchOptions = {}) => {
  const tagSlugs = options.tagSlugs?.map(slugify).filter(Boolean) ?? [];

  let results = getPrompts(options.includeDrafts).filter((prompt) => {
    if (options.categorySlug && prompt.categorySlug !== options.categorySlug) return false;
    if (tagSlugs.length && !tagSlugs.every((tag) => prompt.tagSlugs.includes(tag))) return false;
    if (options.query && !searchableText(prompt).includes(options.query.toLowerCase().trim())) {
      return textRelevance(prompt, options.query) > 0;
    }
    return true;
  });

  const sort = options.sort ?? "recommended";
  results = [...results].sort((a, b) => {
    if (options.query) {
      const relevanceDiff = textRelevance(b, options.query) - textRelevance(a, options.query);
      if (relevanceDiff !== 0) return relevanceDiff;
    }
    if (sort === "helpful") return helpfulRatio(b) - helpfulRatio(a);
    if (sort === "used") return usageScore(b) - usageScore(a);
    if (sort === "newest") return Date.parse(b.publishedAt ?? b.createdAt) - Date.parse(a.publishedAt ?? a.createdAt);
    return recommendedScore(b) - recommendedScore(a);
  });

  return results;
};

export const publicSearch = (options: PromptSearchOptions, session: Session) =>
  searchPrompts(options).map((prompt) => toPublicPrompt(prompt, session));

export const getCategoryRows = (categorySlug: string, session: Session) => {
  const categoryPrompts = getPrompts().filter((prompt) => prompt.categorySlug === categorySlug);
  const asPublic = (items: Prompt[]) => items.slice(0, 6).map((prompt) => toPublicPrompt(prompt, session));

  return {
    picks: asPublic(
      categoryPrompts
        .filter((prompt) => prompt.isFeatured)
        .sort((a, b) => recommendedScore(b) - recommendedScore(a)),
    ),
    top: asPublic([...categoryPrompts].sort((a, b) => recommendedScore(b) - recommendedScore(a))),
    mostUsed: asPublic([...categoryPrompts].sort((a, b) => usageScore(b) - usageScore(a))),
    mostHelpful: asPublic(
      [...categoryPrompts].sort((a, b) => {
        const aMetric = getMetric(a.id);
        const bMetric = getMetric(b.id);
        return helpfulRatio(b) * Math.min(1, bMetric.helpfulCount / 8) - helpfulRatio(a) * Math.min(1, aMetric.helpfulCount / 8);
      }),
    ),
  };
};

export const relatedPrompts = (prompt: Prompt, session: Session) => {
  const tagSet = new Set(prompt.tagSlugs);
  return getPrompts()
    .filter((candidate) => candidate.id !== prompt.id)
    .map((candidate) => ({
      candidate,
      overlap:
        (candidate.categorySlug === prompt.categorySlug ? 3 : 0) +
        candidate.tagSlugs.filter((tag) => tagSet.has(tag)).length,
    }))
    .filter((item) => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || recommendedScore(b.candidate) - recommendedScore(a.candidate))
    .slice(0, 4)
    .map((item) => toPublicPrompt(item.candidate, session));
};

export const promptUseNotes = (promptId: string) => getPublicUseNotesForPrompt(promptId);

export const availableFilterTags = (categorySlug?: string) => {
  const prompts = searchPrompts({ categorySlug });
  const tagCounts = new Map<string, number>();
  prompts.forEach((prompt) => prompt.tagSlugs.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)));

  return getTags()
    .filter((tag) => tagCounts.has(tag.slug))
    .sort((a, b) => (tagCounts.get(b.slug) ?? 0) - (tagCounts.get(a.slug) ?? 0) || a.name.localeCompare(b.name));
};

export const categoryStats = () =>
  getCategories().map((category) => {
    const categoryPrompts = getPrompts().filter((prompt) => prompt.categorySlug === category.slug);
    return {
      category,
      promptCount: categoryPrompts.length,
      freeCount: categoryPrompts.filter((prompt) => prompt.accessLevel === "free").length,
      testedCount: categoryPrompts.filter((prompt) => prompt.isMuditaTested).length,
    };
  });

