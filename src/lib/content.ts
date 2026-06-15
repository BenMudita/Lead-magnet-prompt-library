import type { Category, Prompt, PromptMetric, Tag, UseNote } from "./types";

const NOW = "2026-06-15T12:00:00.000Z";

export const categories: Category[] = [
  {
    id: "cat_marketing",
    name: "Marketing",
    slug: "marketing",
    description: "Prompts for campaigns, content, positioning, and customer research.",
    displayOrder: 1,
    isActive: true,
    icon: "Megaphone",
    accent: "teal",
    primaryTags: ["email", "social", "strategy", "planning", "B2B"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_sales",
    name: "Sales",
    slug: "sales",
    description: "Prompts for outbound, discovery, objections, follow-up, and pipeline.",
    displayOrder: 2,
    isActive: true,
    icon: "Handshake",
    accent: "indigo",
    primaryTags: ["outbound", "follow-up", "B2B", "meeting", "strategy"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_finance",
    name: "Finance",
    slug: "finance",
    description: "Prompts for budgets, variance reviews, forecasts, and plain-English analysis.",
    displayOrder: 3,
    isActive: true,
    icon: "LineChart",
    accent: "emerald",
    primaryTags: ["finance", "analysis", "planning", "budget", "reporting"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_hr",
    name: "HR & Recruiting",
    slug: "hr-recruiting",
    description: "Prompts for hiring, onboarding, candidate screens, and people operations.",
    displayOrder: 4,
    isActive: true,
    icon: "UsersRound",
    accent: "rose",
    primaryTags: ["hiring", "onboarding", "meeting", "planning", "interview"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_engineering",
    name: "Engineering",
    slug: "engineering",
    description: "Prompts for planning, code review prep, bug triage, and technical communication.",
    displayOrder: 5,
    isActive: true,
    icon: "Code2",
    accent: "blue",
    primaryTags: ["analysis", "planning", "meeting", "documentation", "risk"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_operations",
    name: "Operations",
    slug: "operations",
    description: "Prompts for SOPs, workflows, handoffs, process cleanup, and reporting.",
    displayOrder: 6,
    isActive: true,
    icon: "Workflow",
    accent: "amber",
    primaryTags: ["operations", "checklist", "planning", "handoff", "analysis"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_product",
    name: "Product",
    slug: "product",
    description: "Prompts for discovery, roadmaps, specs, tradeoffs, and launch planning.",
    displayOrder: 7,
    isActive: true,
    icon: "PanelsTopLeft",
    accent: "violet",
    primaryTags: ["strategy", "planning", "research", "meeting", "roadmap"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_founder",
    name: "Founder/Startup",
    slug: "founder-startup",
    description: "Prompts for early strategy, investor updates, experiments, and founder focus.",
    displayOrder: 8,
    isActive: true,
    icon: "Rocket",
    accent: "orange",
    primaryTags: ["startup", "strategy", "planning", "fundraising", "analysis"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat_support",
    name: "Customer Support",
    slug: "customer-support",
    description: "Prompts for support replies, help docs, escalation summaries, and feedback loops.",
    displayOrder: 9,
    isActive: true,
    icon: "LifeBuoy",
    accent: "cyan",
    primaryTags: ["customer support", "email", "onboarding", "documentation", "feedback"],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const tagNames = [
  "email",
  "social",
  "B2B",
  "hiring",
  "outbound",
  "strategy",
  "finance",
  "customer support",
  "onboarding",
  "meeting",
  "analysis",
  "planning",
  "budget",
  "reporting",
  "follow-up",
  "interview",
  "documentation",
  "risk",
  "operations",
  "checklist",
  "handoff",
  "research",
  "roadmap",
  "startup",
  "fundraising",
  "feedback",
  "launch",
  "positioning",
  "prioritization",
  "moderation",
  "approved",
];

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const tags: Tag[] = tagNames.map((name) => ({
  id: `tag_${slugify(name)}`,
  name,
  slug: slugify(name),
  status: "approved",
  createdAt: NOW,
  updatedAt: NOW,
}));

const templates = [
  {
    title: "weekly priority plan",
    explanation: "Turns a messy list of work into a simple one-week plan with the most important actions first.",
    tags: ["planning", "strategy"],
    task: "turn a messy list of priorities into a focused one-week plan",
  },
  {
    title: "plain-English email draft",
    explanation: "Helps you draft a clear email that sounds useful, direct, and easy to respond to.",
    tags: ["email", "follow-up"],
    task: "write a practical email for a real work situation",
  },
  {
    title: "audience or stakeholder snapshot",
    explanation: "Summarizes what a specific audience cares about so your next action is easier to choose.",
    tags: ["research", "analysis"],
    task: "understand the audience, stakeholder, or user group I am trying to help",
  },
  {
    title: "meeting prep brief",
    explanation: "Creates a short prep note with goals, questions, risks, and the decision needed from a meeting.",
    tags: ["meeting", "planning"],
    task: "prepare for an upcoming meeting without overthinking it",
  },
  {
    title: "data-to-insights summary",
    explanation: "Turns raw notes, metrics, or observations into a few useful insights and next steps.",
    tags: ["analysis", "reporting"],
    task: "summarize rough data or notes into insights a busy person can use",
  },
  {
    title: "objection response",
    explanation: "Helps you respond to a concern with empathy, clarity, and a practical next step.",
    tags: ["customer support", "email"],
    task: "respond to a concern, objection, or blocker in a helpful way",
  },
  {
    title: "checklist builder",
    explanation: "Builds a clear checklist so repeated work can happen with fewer dropped details.",
    tags: ["checklist", "operations"],
    task: "turn a repeated task into a checklist someone else can follow",
  },
  {
    title: "30-day action calendar",
    explanation: "Creates a simple 30-day calendar with weekly themes and daily actions.",
    tags: ["planning", "launch"],
    task: "plan a practical 30-day sequence of actions",
  },
  {
    title: "process improvement ideas",
    explanation: "Finds low-risk ways to make a workflow faster, clearer, or less frustrating.",
    tags: ["operations", "analysis"],
    task: "improve a process that is slower or messier than it should be",
  },
  {
    title: "stakeholder update",
    explanation: "Writes a concise update that covers progress, decisions, risks, and asks.",
    tags: ["reporting", "meeting"],
    task: "write an update that helps other people understand status quickly",
  },
  {
    title: "resource tradeoff review",
    explanation: "Compares options when time, money, people, or attention are limited.",
    tags: ["budget", "prioritization"],
    task: "compare a few possible paths and choose the most sensible next move",
  },
  {
    title: "risk and quality check",
    explanation: "Reviews a plan for likely problems, missing details, and simple prevention steps.",
    tags: ["risk", "analysis"],
    task: "spot risks and quality issues before I act",
  },
];

const categoryFocus: Record<string, string> = {
  marketing: "campaign, audience, offer, channel, and content",
  sales: "prospect, account, objection, next step, and pipeline stage",
  finance: "numbers, assumptions, variance, budget, and decision context",
  "hr-recruiting": "role, candidate, hiring stage, team context, and constraints",
  engineering: "system, user impact, technical risk, scope, and rollout",
  operations: "workflow, owner, handoff, deadline, and success standard",
  product: "user problem, product bet, evidence, tradeoff, and launch risk",
  "founder-startup": "market, customer pain, wedge, traction, and founder constraint",
  "customer-support": "customer issue, tone, policy, timeline, and desired resolution",
};

const buildBody = (category: Category, template: (typeof templates)[number]) => `You are helping me with ${category.name.toLowerCase()} work.

My goal: [describe the outcome you want]
Current situation: [paste notes, context, metrics, or rough thoughts]
Audience or owner: [who this is for]
Constraints: [time, resources, policy, tone, or must-avoid items]

Focus on: ${categoryFocus[category.slug]}.

Please help me ${template.task}.

Return:
1. A plain-English summary of the situation.
2. The 3-5 most important questions or assumptions.
3. A practical draft, plan, or recommendation I can use today.
4. Any risks, tradeoffs, or missing details I should check.
5. A shorter version I can paste into an email, doc, or message.

Use simple language. If you need more context, ask up to three clarifying questions first.`;

export const prompts: Prompt[] = categories.flatMap((category, categoryIndex) =>
  templates.map((template, templateIndex) => {
    const title = `${category.name} ${template.title}`
      .replace("HR & Recruiting", "HR and recruiting")
      .replace("Founder/Startup", "Founder");
    const slug = slugify(title);
    const freeSample = templateIndex === 0 || templateIndex === 1;
    const featured = templateIndex === 0 || templateIndex === 3 || templateIndex === 7;
    const tested = templateIndex === 0 || templateIndex === 1 || templateIndex === 4;
    const createdAt = new Date(Date.UTC(2026, 5, 1 + templateIndex)).toISOString();

    return {
      id: `prompt_${category.slug}_${templateIndex + 1}`,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      slug,
      body: buildBody(category, template),
      plainEnglishExplanation: `${template.explanation} Built for ${category.name.toLowerCase()} work.`,
      categoryId: category.id,
      categorySlug: category.slug,
      tagSlugs: Array.from(
        new Set([...category.primaryTags.slice(0, 3), ...template.tags].map(slugify)),
      ).slice(0, 6),
      accessLevel: freeSample ? "free" : "pro",
      status: "published",
      editorialQualityScore: 72 + ((categoryIndex * 5 + templateIndex * 3) % 25),
      isFeatured: featured,
      isMuditaTested: tested,
      testedAt: tested ? new Date(Date.UTC(2026, 5, 8 + templateIndex)).toISOString() : undefined,
      testedByUserId: tested ? "user_mudita_editor" : undefined,
      testedByType: tested ? (templateIndex === 4 ? "agent" : "human") : undefined,
      testingNotes: tested
        ? "Ran against a realistic beginner scenario and produced specific, usable output with minimal cleanup."
        : undefined,
      sourceNotes: "Seeded Mudita launch inventory; original prompt created for V1 library coverage.",
      createdByUserId: "user_mudita_editor",
      publishedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    } satisfies Prompt;
  }),
);

export const metrics: PromptMetric[] = prompts.map((prompt, index) => {
  const base = 18 + ((index * 17) % 160);
  const featuredBoost = prompt.isFeatured ? 85 : 0;
  const testedBoost = prompt.isMuditaTested ? 35 : 0;
  const copyCount = base + featuredBoost + testedBoost;
  const sendChatgptCount = Math.floor(copyCount * 0.26);
  const sendClaudeCount = Math.floor(copyCount * 0.18);
  const helpfulCount = Math.max(2, Math.floor(copyCount * (0.18 + (index % 5) * 0.015)));
  const notHelpfulCount = Math.floor(helpfulCount * (0.08 + (index % 3) * 0.03));

  return {
    promptId: prompt.id,
    viewsCount: copyCount * 4 + 25,
    detailViewsCount: copyCount * 2 + 12,
    copyCount,
    sendChatgptCount,
    sendClaudeCount,
    shareCount: Math.floor(copyCount * 0.09),
    helpfulCount,
    notHelpfulCount,
    lastUsedAt: new Date(Date.UTC(2026, 5, 12 + (index % 3))).toISOString(),
    updatedAt: NOW,
  };
});

export const seedUseNotes: UseNote[] = prompts
  .filter((prompt) => prompt.isFeatured || prompt.isMuditaTested)
  .slice(0, 36)
  .flatMap((prompt, index) => [
    {
      id: `note_${prompt.id}_team`,
      promptId: prompt.id,
      userId: "user_mudita_editor",
      body: `Mudita team note: this worked best when the user pasted rough notes first, then asked the model to tighten the answer for ${prompt.categorySlug.replace(/-/g, " ")} context.`,
      status: "approved",
      isPublic: true,
      isFeatured: index % 4 === 0,
      isMuditaTeamNote: true,
      moderatedByUserId: "user_mudita_editor",
      moderatedAt: NOW,
      createdAt: NOW,
    },
    {
      id: `note_${prompt.id}_user`,
      promptId: prompt.id,
      userId: "user_seed_member",
      body: "Used this to turn scattered notes into a first draft I could actually send to my team.",
      status: "approved",
      isPublic: true,
      isFeatured: false,
      isMuditaTeamNote: false,
      moderatedByUserId: "user_mudita_editor",
      moderatedAt: NOW,
      createdAt: NOW,
    },
  ]);
