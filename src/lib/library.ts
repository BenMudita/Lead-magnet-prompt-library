import type { Prompt, PromptMetric, PromptSearchOptions, PublicPrompt, Session, Tag, UseNote } from "./types";
import {
  getCategories,
  getCategoryBySlug,
  getMetric,
  getMetrics,
  getPrompts,
  getPublicUseNotesForPrompt,
  getTags,
  getUseNotes,
} from "./prompt-data";
import { slugify } from "./content";
import { isAdminRole } from "./session";

export const previewBody = (body: string, length = 360) => {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length).trim()}...` : compact;
};

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
  updatedAt: new Date().toISOString(),
});

const metricFor = (metrics: Map<string, PromptMetric>, promptId: string) =>
  metrics.get(promptId) ?? defaultMetric(promptId);

const helpfulRatioFromMetric = (metric: PromptMetric) =>
  (metric.helpfulCount + 2) / (metric.helpfulCount + metric.notHelpfulCount + 4);

export const helpfulRatio = async (prompt: Prompt) =>
  helpfulRatioFromMetric(await getMetric(prompt.id));

export const voteCount = (metric: PromptMetric) => metric.helpfulCount + metric.notHelpfulCount;

export const helpfulPercent = (metric: PromptMetric) =>
  Math.round(helpfulRatioFromMetric(metric) * 100);

export const copiesThisWeek = (metric: PromptMetric) => Math.max(18, Math.round(metric.copyCount * 0.24));

export const updatedLabel = (isoDate?: string) => {
  if (!isoDate) return "Updated recently";
  const days = Math.max(1, Math.round((Date.now() - Date.parse(isoDate)) / 86_400_000));
  if (days <= 1) return "Updated today";
  if (days < 14) return `Updated ${days} days ago`;
  return "Updated recently";
};

const usageScoreFromMetric = (metric: PromptMetric) => {
  const usage = metric.copyCount + metric.sendChatgptCount + metric.sendClaudeCount;
  return Math.min(100, Math.log1p(usage) * 18);
};

const freshnessScore = (prompt: Prompt) => {
  const published = prompt.publishedAt ? Date.parse(prompt.publishedAt) : Date.parse(prompt.createdAt);
  const ageDays = Math.max(0, (Date.now() - published) / 86_400_000);
  return Math.max(35, 100 - ageDays * 0.25);
};

const recommendedScoreFromMetric = (prompt: Prompt, metric: PromptMetric) => {
  const helpful = helpfulRatioFromMetric(metric) * 100;
  const sourceSignal = Math.min(100, metric.shareCount * 3);
  const score =
    prompt.editorialQualityScore * 0.45 +
    helpful * 0.25 +
    usageScoreFromMetric(metric) * 0.2 +
    sourceSignal * 0.05 +
    freshnessScore(prompt) * 0.05 +
    (prompt.isMuditaTested ? 8 : 0) +
    (prompt.isFeatured ? 12 : 0);

  return Math.round(score * 10) / 10;
};

export const recommendedScore = async (prompt: Prompt) =>
  recommendedScoreFromMetric(prompt, await getMetric(prompt.id));

export const canAccessPrompt = (session: Session, prompt: Prompt) => {
  void prompt;
  return session.accountStatus !== "guest" || isAdminRole(session.role);
};

export const canCopyPrompt = canAccessPrompt;

const toPublicPromptWithContext = ({
  prompt,
  session,
  tags,
  metric,
}: {
  prompt: Prompt;
  session: Session;
  tags: Tag[];
  metric: PromptMetric;
}): PublicPrompt => {
  const category = getCategoryBySlug(prompt.categorySlug);
  if (!category) throw new Error(`Missing category ${prompt.categorySlug}`);
  const tagList = tags.filter((tag) => prompt.tagSlugs.includes(tag.slug));
  const canAccess = canAccessPrompt(session, prompt);
  const canCopy = canCopyPrompt(session, prompt);

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
    recommendedScore: recommendedScoreFromMetric(prompt, metric),
    helpfulRatio: helpfulRatioFromMetric(metric),
    isFeatured: prompt.isFeatured,
    isMuditaTested: prompt.isMuditaTested,
    testedAt: prompt.testedAt,
    testingNotes: isAdminRole(session.role) ? prompt.testingNotes : undefined,
    metric,
    isLocked: !canAccess,
    canCopy,
    accessMessage: canAccess
      ? "Available"
      : "Create a free account with your email to unlock and copy every prompt.",
  };
};

const toPublicPrompts = async (prompts: Prompt[], session: Session) => {
  const [tags, metrics] = await Promise.all([
    getTags(),
    getMetrics(prompts.map((prompt) => prompt.id)),
  ]);

  return prompts.map((prompt) =>
    toPublicPromptWithContext({
      prompt,
      session,
      tags,
      metric: metricFor(metrics, prompt.id),
    }),
  );
};

export const toPublicPrompt = async (prompt: Prompt, session: Session) => {
  const [tags, metric] = await Promise.all([getTags(), getMetric(prompt.id)]);
  return toPublicPromptWithContext({ prompt, session, tags, metric });
};

const searchableText = (prompt: Prompt, tags: Tag[], notes: UseNote[]) => {
  const category = getCategoryBySlug(prompt.categorySlug);
  const tagNames = tags
    .filter((tag) => prompt.tagSlugs.includes(tag.slug))
    .map((tag) => tag.name)
    .join(" ");
  const noteText = notes
    .filter((note) => note.promptId === prompt.id && note.status === "approved" && note.isPublic)
    .map((note) => note.body)
    .join(" ");
  return [
    prompt.title,
    prompt.plainEnglishExplanation,
    prompt.body,
    category?.name,
    category?.description,
    tagNames,
    noteText,
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

export const searchPrompts = async (options: PromptSearchOptions = {}) => {
  const tagSlugs = options.tagSlugs?.map(slugify).filter(Boolean) ?? [];
  const [prompts, tags, notes] = await Promise.all([
    getPrompts(options.includeDrafts),
    getTags(true),
    getUseNotes("approved"),
  ]);

  let results = prompts.filter((prompt) => {
    if (options.categorySlug && prompt.categorySlug !== options.categorySlug) return false;
    if (tagSlugs.length && !tagSlugs.every((tag) => prompt.tagSlugs.includes(tag))) return false;
    if (options.query && !searchableText(prompt, tags, notes).includes(options.query.toLowerCase().trim())) {
      return textRelevance(prompt, options.query) > 0;
    }
    return true;
  });

  const metrics = await getMetrics(results.map((prompt) => prompt.id));
  const sort = options.sort ?? "recommended";
  results = [...results].sort((a, b) => {
    const aMetric = metricFor(metrics, a.id);
    const bMetric = metricFor(metrics, b.id);
    if (options.query) {
      const relevanceDiff = textRelevance(b, options.query) - textRelevance(a, options.query);
      if (relevanceDiff !== 0) return relevanceDiff;
    }
    if (sort === "helpful") return helpfulRatioFromMetric(bMetric) - helpfulRatioFromMetric(aMetric);
    if (sort === "used") return usageScoreFromMetric(bMetric) - usageScoreFromMetric(aMetric);
    if (sort === "newest") return Date.parse(b.publishedAt ?? b.createdAt) - Date.parse(a.publishedAt ?? a.createdAt);
    return recommendedScoreFromMetric(b, bMetric) - recommendedScoreFromMetric(a, aMetric);
  });

  return results;
};

export const publicSearch = async (options: PromptSearchOptions, session: Session) =>
  toPublicPrompts(await searchPrompts(options), session);

const fromIds = async (ids: string[], session: Session) => {
  const promptMap = new Map((await getPrompts()).map((prompt) => [prompt.id, prompt]));
  return toPublicPrompts(
    ids.flatMap((id) => {
      const prompt = promptMap.get(id);
      return prompt ? [prompt] : [];
    }),
    session,
  );
};

export const homepageTrending = async (session: Session) =>
  (await fromIds(
    [
      "prompt_founder-startup_10",
      "prompt_sales_2",
      "prompt_marketing_8",
      "prompt_product_3",
      "prompt_engineering_12",
    ],
    session,
  )).sort((a, b) => copiesThisWeek(b.metric) - copiesThisWeek(a.metric));

export const homepagePicks = async (session: Session) =>
  fromIds(
    [
      "prompt_founder-startup_8",
      "prompt_operations_5",
      "prompt_finance_5",
      "prompt_hr-recruiting_11",
      "prompt_customer-support_6",
      "prompt_product_3",
    ],
    session,
  );

export const homepageRoleSlugs = [
  "marketing",
  "sales",
  "product",
  "founder-startup",
  "finance",
  "hr-recruiting",
  "engineering",
  "operations",
  "customer-support",
];

export type QuickFilter = {
  label: string;
  category?: string;
  tag?: string;
};

export const quickFilters: QuickFilter[] = [
  { label: "Marketing", category: "marketing" },
  { label: "Sales", category: "sales" },
  { label: "Founder", category: "founder-startup" },
  { label: "Product", category: "product" },
  { label: "Email", tag: "email" },
  { label: "Meeting", tag: "meeting" },
  { label: "Launch", tag: "launch" },
  { label: "Analysis", tag: "analysis" },
  { label: "Planning", tag: "planning" },
  { label: "Finance", category: "finance" },
  { label: "Engineering", category: "engineering" },
  { label: "Customer Support", category: "customer-support" },
];

export const communityActivity = async (session: Session) => {
  const [notes, prompts] = await Promise.all([getUseNotes("approved"), getPrompts()]);
  const promptMap = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const publicPrompts = await toPublicPrompts(
    notes.flatMap((note) => {
      const prompt = promptMap.get(note.promptId);
      return prompt && note.isPublic ? [prompt] : [];
    }),
    session,
  );
  const publicById = new Map(publicPrompts.map((prompt) => [prompt.id, prompt]));

  return notes
    .filter((note) => note.isPublic)
    .map((note) => {
      const prompt = publicById.get(note.promptId);
      return prompt ? { note, prompt } : undefined;
    })
    .filter((item): item is { note: UseNote; prompt: PublicPrompt } => Boolean(item))
    .sort(
      (a, b) =>
        Number(b.note.isFeatured) - Number(a.note.isFeatured) ||
        b.prompt.metric.copyCount - a.prompt.metric.copyCount ||
        b.note.createdAt.localeCompare(a.note.createdAt),
    )
    .slice(0, 4);
};

export const getCategoryRows = async (categorySlug: string, session: Session) => {
  const categoryPrompts = (await getPrompts()).filter((prompt) => prompt.categorySlug === categorySlug);
  const metrics = await getMetrics(categoryPrompts.map((prompt) => prompt.id));
  const asPublic = (items: Prompt[]) => toPublicPrompts(items.slice(0, 6), session);

  return {
    picks: await asPublic(
      categoryPrompts
        .filter((prompt) => prompt.isFeatured)
        .sort((a, b) => recommendedScoreFromMetric(b, metricFor(metrics, b.id)) - recommendedScoreFromMetric(a, metricFor(metrics, a.id))),
    ),
    top: await asPublic(
      [...categoryPrompts].sort(
        (a, b) => recommendedScoreFromMetric(b, metricFor(metrics, b.id)) - recommendedScoreFromMetric(a, metricFor(metrics, a.id)),
      ),
    ),
    mostUsed: await asPublic(
      [...categoryPrompts].sort(
        (a, b) => usageScoreFromMetric(metricFor(metrics, b.id)) - usageScoreFromMetric(metricFor(metrics, a.id)),
      ),
    ),
    mostHelpful: await asPublic(
      [...categoryPrompts].sort((a, b) => {
        const aMetric = metricFor(metrics, a.id);
        const bMetric = metricFor(metrics, b.id);
        return (
          helpfulRatioFromMetric(bMetric) * Math.min(1, bMetric.helpfulCount / 8) -
          helpfulRatioFromMetric(aMetric) * Math.min(1, aMetric.helpfulCount / 8)
        );
      }),
    ),
  };
};

export const relatedPrompts = async (prompt: Prompt, session: Session) => {
  const tagSet = new Set(prompt.tagSlugs);
  const prompts = await getPrompts();
  const candidates = prompts
    .filter((candidate) => candidate.id !== prompt.id)
    .map((candidate) => ({
      candidate,
      overlap:
        (candidate.categorySlug === prompt.categorySlug ? 3 : 0) +
        candidate.tagSlugs.filter((tag) => tagSet.has(tag)).length,
    }))
    .filter((item) => item.overlap > 0);
  const metrics = await getMetrics(candidates.map((item) => item.candidate.id));

  return toPublicPrompts(
    candidates
      .sort(
        (a, b) =>
          b.overlap - a.overlap ||
          recommendedScoreFromMetric(b.candidate, metricFor(metrics, b.candidate.id)) -
            recommendedScoreFromMetric(a.candidate, metricFor(metrics, a.candidate.id)),
      )
      .slice(0, 4)
      .map((item) => item.candidate),
    session,
  );
};

export const promptUseNotes = (promptId: string) => getPublicUseNotesForPrompt(promptId);

export const promptValueGuide = (prompt: Prompt) => {
  const title = prompt.title.toLowerCase();
  const category = getCategoryBySlug(prompt.categorySlug);
  const categoryName = category?.name ?? "your team";

  if (title.includes("investor update")) {
    return {
      helpsWith: ["Turns rough founder notes into a clear update", "Highlights traction, blockers, risks, and asks", "Keeps investors informed without sounding overproduced"],
      bestFor: ["Founders", "Startup operators", "Investor relations leads"],
      youllGet: ["A concise investor update", "A metrics and progress section", "A clear asks and next steps section"],
    };
  }

  if (title.includes("content calendar") || title.includes("launch plan")) {
    return {
      helpsWith: ["Turns a broad launch goal into a practical plan", "Organizes weekly themes and daily actions", "Spots missing owners, channels, and launch risks"],
      bestFor: ["Founders", "Marketing leads", "Product leads"],
      youllGet: ["A structured calendar", "Suggested actions by week", "Risks, owners, and checkpoints"],
    };
  }

  if (title.includes("customer feedback")) {
    return {
      helpsWith: ["Clusters messy feedback into clear themes", "Finds product opportunities and blockers", "Turns comments into next research questions"],
      bestFor: ["Product managers", "Founders", "Customer-facing teams"],
      youllGet: ["Insight themes", "Potential product bets", "Follow-up questions and risks"],
    };
  }

  if (title.includes("risks")) {
    return {
      helpsWith: ["Reviews plans before the team commits", "Identifies blockers, dependencies, and unclear owners", "Suggests mitigation steps that are easy to act on"],
      bestFor: ["Engineering managers", "Product leads", "Team leads"],
      youllGet: ["A ranked risk list", "Missing assumptions", "Recommended next actions"],
    };
  }

  if (title.includes("meeting notes")) {
    return {
      helpsWith: ["Turns rough notes into a clean team summary", "Separates decisions from open questions", "Pulls out owners, deadlines, and follow-ups"],
      bestFor: ["Operators", "Team leads", "Project owners"],
      youllGet: ["A meeting summary", "Decision and action lists", "Open questions to resolve"],
    };
  }

  return {
    helpsWith: [
      `Turns rough ${categoryName.toLowerCase()} context into a usable draft`,
      "Prioritizes the highest-impact work",
      "Identifies risks, blockers, and next actions",
    ],
    bestFor: [categoryName, "Founders", "Team leads"],
    youllGet: ["A clear first draft", "Suggested next actions", "Risks and missing context to check"],
  };
};

export const availableFilterTags = async (categorySlug?: string) => {
  const prompts = await searchPrompts({ categorySlug });
  const tagCounts = new Map<string, number>();
  prompts.forEach((prompt) => prompt.tagSlugs.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)));

  return (await getTags())
    .filter((tag) => tagCounts.has(tag.slug))
    .sort((a, b) => (tagCounts.get(b.slug) ?? 0) - (tagCounts.get(a.slug) ?? 0) || a.name.localeCompare(b.name));
};

export const categoryStats = async () => {
  const prompts = await getPrompts();
  return getCategories().map((category) => {
    const categoryPrompts = prompts.filter((prompt) => prompt.categorySlug === category.slug);
    return {
      category,
      promptCount: categoryPrompts.length,
      freeCount: categoryPrompts.filter((prompt) => prompt.accessLevel === "free").length,
      testedCount: categoryPrompts.filter((prompt) => prompt.isMuditaTested).length,
    };
  });
};
