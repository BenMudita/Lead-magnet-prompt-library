export type AccountStatus = "guest" | "free" | "pro";

export type UserRole =
  | "visitor"
  | "member"
  | "admin"
  | "editor"
  | "moderator"
  | "analyst";

export type PromptAccessLevel = "free" | "pro";
export type PromptStatus = "draft" | "in_review" | "published" | "archived";
export type TagStatus = "suggested" | "approved" | "hidden" | "merged";
export type VoteValue = "helpful" | "not_helpful";
export type UseNoteStatus = "pending" | "approved" | "rejected";
export type LeadMagnetStatus = "draft" | "published" | "archived";

export interface Session {
  accountStatus: AccountStatus;
  role: UserRole;
  email?: string;
  userId?: string;
  anonymousId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  icon: string;
  accent: string;
  primaryTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  status: TagStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  slug: string;
  body: string;
  plainEnglishExplanation: string;
  categoryId: string;
  categorySlug: string;
  tagSlugs: string[];
  accessLevel: PromptAccessLevel;
  status: PromptStatus;
  editorialQualityScore: number;
  isFeatured: boolean;
  isMuditaTested: boolean;
  testedAt?: string;
  testedByUserId?: string;
  testedByType?: "human" | "agent";
  testingNotes?: string;
  sourceUrl?: string;
  sourceNotes?: string;
  createdByUserId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptMetric {
  promptId: string;
  viewsCount: number;
  detailViewsCount: number;
  copyCount: number;
  sendChatgptCount: number;
  sendClaudeCount: number;
  shareCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  lastUsedAt?: string;
  updatedAt: string;
}

export interface PromptVote {
  id: string;
  promptId: string;
  userId?: string;
  anonymousId?: string;
  vote: VoteValue;
  createdAt: string;
}

export interface UseNote {
  id: string;
  promptId: string;
  userId?: string;
  body: string;
  status: UseNoteStatus;
  isPublic: boolean;
  isFeatured: boolean;
  isMuditaTeamNote: boolean;
  moderatedByUserId?: string;
  moderatedAt?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  userId?: string;
  anonymousId: string;
  properties: Record<string, unknown>;
  url?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

export interface LeadMagnetEntry {
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
  ctaLabel: string;
  ctaUrl: string;
  proofLabel: string;
  copyCount: number;
  helpfulPercent: number;
  status: LeadMagnetStatus;
  isFeatured: boolean;
  isTrending: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadMagnetSearchOptions {
  query?: string;
  category?: string;
  tag?: string;
  includeDrafts?: boolean;
}

export interface PublicPrompt {
  id: string;
  title: string;
  slug: string;
  body?: string;
  bodyPreview: string;
  plainEnglishExplanation: string;
  category: Category;
  tags: Tag[];
  accessLevel: PromptAccessLevel;
  status: PromptStatus;
  recommendedScore: number;
  helpfulRatio: number;
  isFeatured: boolean;
  isMuditaTested: boolean;
  testedAt?: string;
  testingNotes?: string;
  metric: PromptMetric;
  isLocked: boolean;
  canCopy: boolean;
  accessMessage: string;
}

export interface PromptSearchOptions {
  query?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  sort?: "recommended" | "helpful" | "used" | "newest";
  includeDrafts?: boolean;
}
