import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
}

function loadContentModule() {
  const source = fs.readFileSync("src/lib/content.ts", "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const cjsModule = { exports: {} };
  const sandbox = {
    exports: cjsModule.exports,
    module: cjsModule,
    require(id) {
      if (id === "./types") return {};
      throw new Error(`Unexpected seed import: ${id}`);
    },
  };
  vm.runInNewContext(compiled, sandbox, { filename: "content.js" });
  return cjsModule.exports;
}

async function upsert(supabase, table, rows, onConflict) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required to seed Supabase.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { categories, tags, prompts, metrics, seedUseNotes, seedLeadMagnetEntries } = loadContentModule();
const tagIdBySlug = new Map(tags.map((tag) => [tag.slug, tag.id]));

await upsert(
  supabase,
  "plans",
  [
    {
      id: "founding-member-yearly",
      name: "Founding Member",
      price_cents: 4900,
      billing_interval: "year",
      is_active: true,
      is_founding_member: true,
      member_limit: 500,
    },
  ],
  "id",
);

await upsert(
  supabase,
  "categories",
  categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    accent: category.accent,
    primary_tags: category.primaryTags,
    display_order: category.displayOrder,
    is_active: category.isActive,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  })),
  "id",
);

await upsert(
  supabase,
  "tags",
  tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    status: tag.status,
    created_at: tag.createdAt,
    updated_at: tag.updatedAt,
  })),
  "id",
);

await upsert(
  supabase,
  "prompts",
  prompts.map((prompt) => ({
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
    tested_by_user_id: null,
    tested_by_type: prompt.testedByType ?? null,
    testing_notes: prompt.testingNotes ?? null,
    source_url: prompt.sourceUrl ?? null,
    source_notes: prompt.sourceNotes ?? null,
    created_by_user_id: null,
    published_at: prompt.publishedAt ?? null,
    created_at: prompt.createdAt,
    updated_at: prompt.updatedAt,
  })),
  "id",
);

await upsert(
  supabase,
  "prompt_tags",
  prompts.flatMap((prompt) =>
    prompt.tagSlugs
      .map((slug) => tagIdBySlug.get(slug))
      .filter(Boolean)
      .map((tagId) => ({
        prompt_id: prompt.id,
        tag_id: tagId,
        source: "seed",
        approved_by_user_id: null,
      })),
  ),
  "prompt_id,tag_id",
);

await upsert(
  supabase,
  "prompt_metrics",
  metrics.map((metric) => ({
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
  })),
  "prompt_id",
);

await upsert(
  supabase,
  "use_notes",
  seedUseNotes.map((note) => ({
    id: note.id,
    prompt_id: note.promptId,
    user_id: null,
    body: note.body,
    status: note.status,
    is_public: note.isPublic,
    is_featured: note.isFeatured,
    is_mudita_team_note: note.isMuditaTeamNote,
    moderated_by_user_id: null,
    moderated_at: note.moderatedAt ?? null,
    created_at: note.createdAt,
  })),
  "id",
);

await upsert(
  supabase,
  "lead_magnet_entries",
  seedLeadMagnetEntries.map((entry) => ({
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
  })),
  "id",
);

console.log(
  `Seeded ${categories.length} categories, ${tags.length} tags, ${prompts.length} prompts, ${metrics.length} metrics, ${seedUseNotes.length} use notes, and ${seedLeadMagnetEntries.length} lead magnet entries.`,
);
