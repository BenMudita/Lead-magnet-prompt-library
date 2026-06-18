import { getCategories } from "./prompt-data";
import { slugify } from "./content";
import type { Prompt, PromptAccessLevel, PromptStatus } from "./types";

export type PromptImportItem = Pick<Prompt, "title" | "body" | "categorySlug"> & Partial<Prompt>;

type RawPromptImport = Record<string, unknown>;

const TRUE_VALUES = new Set(["true", "yes", "y", "1"]);
const PROMPT_STATUSES: PromptStatus[] = ["draft", "in_review", "published", "archived"];
const ACCESS_LEVELS: PromptAccessLevel[] = ["free", "pro"];

const normalizedKey = (key: string) => key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

const valueFor = (row: RawPromptImport, keys: string[]) => {
  const lookup = new Map(Object.entries(row).map(([key, value]) => [normalizedKey(key), value]));
  for (const key of keys) {
    const value = lookup.get(normalizedKey(key));
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.join(",");
  }
  return "";
};

const parseList = (value: string) =>
  value
    .split(/[;,]/)
    .map((item) => slugify(item.trim()))
    .filter(Boolean);

const parseBoolean = (value: string) => TRUE_VALUES.has(value.trim().toLowerCase());

const parseStatus = (value: string, fallback: PromptStatus) => {
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, "_") as PromptStatus;
  return PROMPT_STATUSES.includes(normalized) ? normalized : fallback;
};

const parseAccessLevel = (value: string, fallback: PromptAccessLevel) => {
  const normalized = value.trim().toLowerCase() as PromptAccessLevel;
  return ACCESS_LEVELS.includes(normalized) ? normalized : fallback;
};

const categorySlugFrom = (value: string, fallback: string) => {
  const normalized = slugify(value);
  const match = getCategories().find(
    (category) => category.slug === normalized || slugify(category.name) === normalized,
  );
  return match?.slug ?? fallback;
};

const parseCsv = (content: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  const [headers = [], ...records] = rows.filter((candidate) => candidate.some((item) => item.trim()));
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
};

const parseJson = (content: string): RawPromptImport[] => {
  const parsed = JSON.parse(content) as unknown;
  if (Array.isArray(parsed)) return parsed.filter((item): item is RawPromptImport => Boolean(item && typeof item === "object"));
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { prompts?: unknown }).prompts)) {
    return ((parsed as { prompts: unknown[] }).prompts).filter(
      (item): item is RawPromptImport => Boolean(item && typeof item === "object"),
    );
  }
  throw new Error("JSON must be an array or an object with a prompts array.");
};

const parseRawRows = (content: string): RawPromptImport[] => {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return parseJson(trimmed);
  return parseCsv(trimmed);
};

export function parsePromptImport(
  content: string,
  options: {
    defaultAccessLevel?: PromptAccessLevel;
    defaultCategorySlug?: string;
    defaultStatus?: PromptStatus;
  } = {},
) {
  const defaultAccessLevel = options.defaultAccessLevel ?? "pro";
  const defaultStatus = options.defaultStatus ?? "draft";
  const defaultCategorySlug = options.defaultCategorySlug ?? getCategories()[0]?.slug ?? "marketing";

  return parseRawRows(content).map((row, index) => {
    const title = valueFor(row, ["title", "prompt title", "name"]);
    const body = valueFor(row, ["body", "prompt", "prompt body", "content"]);
    const category = valueFor(row, ["categorySlug", "category slug", "category", "industry", "function"]);

    if (!title) throw new Error(`Row ${index + 1} is missing a title.`);
    if (!body) throw new Error(`Row ${index + 1} is missing prompt body/content.`);

    const plainEnglishExplanation = valueFor(row, [
      "plainEnglishExplanation",
      "plain english explanation",
      "explanation",
      "summary",
      "description",
    ]);
    const tags = valueFor(row, ["tags", "tagSlugs", "tag slugs"]);
    const editorialQualityScore = Number(valueFor(row, ["editorialQualityScore", "quality score", "score"]));
    const status = valueFor(row, ["status"]);
    const accessLevel = valueFor(row, ["accessLevel", "access", "access level"]);

    return {
      title,
      body,
      categorySlug: categorySlugFrom(category || defaultCategorySlug, defaultCategorySlug),
      plainEnglishExplanation: plainEnglishExplanation || undefined,
      tagSlugs: parseList(tags),
      accessLevel: parseAccessLevel(accessLevel, defaultAccessLevel),
      status: parseStatus(status, defaultStatus),
      editorialQualityScore: Number.isFinite(editorialQualityScore) ? editorialQualityScore : undefined,
      isFeatured: parseBoolean(valueFor(row, ["isFeatured", "featured"])),
      isMuditaTested: parseBoolean(valueFor(row, ["isMuditaTested", "tested", "mudita tested"])),
      sourceUrl: valueFor(row, ["sourceUrl", "source url", "url"]) || undefined,
      sourceNotes: valueFor(row, ["sourceNotes", "source notes", "notes"]) || undefined,
    } satisfies PromptImportItem;
  });
}
