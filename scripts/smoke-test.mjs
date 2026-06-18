import fs from "node:fs";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.local");

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
let cookie = "";
const authProvider = process.env.AUTH_PROVIDER ?? "demo";

function captureCookies(response) {
  const raw = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  if (!raw.length) return;
  const next = raw
    .flatMap((value) => value.split(/,(?=\s*[^;,]+=)/))
    .map((value) => value.split(";")[0].trim());
  const jar = new Map(cookie.split("; ").filter(Boolean).map((part) => part.split("=")));
  for (const part of next) {
    const [key, ...rest] = part.split("=");
    jar.set(key, rest.join("="));
  }
  cookie = Array.from(jar)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

async function request(path, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { ...init, headers, redirect: "manual" });
  captureCookies(response);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep non-JSON text responses for route checks.
  }
  return { response, body };
}

function assert(condition, label, detail = "") {
  if (!condition) {
    throw new Error(`${label} failed ${detail}`);
  }
  console.log(`PASS ${label}`);
}

let result = await request("/promptlibrary");
assert(result.response.status === 200, "home loads", result.response.status);

result = await request("/api/promptlibrary/prompts/prompt_marketing_3");
assert(
  result.body.prompt?.isLocked === true && !("body" in result.body.prompt),
  "guest premium prompt is redacted",
);

result = await request("/api/promptlibrary/prompts/prompt_marketing_3/copy", { method: "POST" });
assert(result.response.status === 402, "guest premium copy blocked", result.response.status);

if (authProvider === "supabase") {
  result = await request("/api/admin/prompts");
  assert(result.response.status === 403, "admin blocked for guest");
  console.log("SKIP demo session checks because AUTH_PROVIDER=supabase");
  process.exit(0);
}

result = await request("/api/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accountStatus: "free", role: "member", email: "free@example.com" }),
});
assert(result.body.accountStatus === "free", "free session created");

result = await request("/api/promptlibrary/prompts/prompt_marketing_1/copy", { method: "POST" });
assert(result.response.status === 200 && result.body.body?.includes("You are helping me"), "free sample copy allowed");

result = await request("/api/promptlibrary/prompts/prompt_marketing_3/copy", { method: "POST" });
assert(result.response.status === 402, "free user premium copy blocked", result.response.status);

result = await request("/api/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ redirect: "/promptlibrary/p/marketing-audience-or-stakeholder-snapshot" }),
});
assert(result.response.status === 200, "demo checkout succeeds");

result = await request("/api/promptlibrary/prompts/prompt_marketing_3/copy", { method: "POST" });
assert(result.response.status === 200 && result.body.body?.includes("You are helping me"), "pro premium copy allowed");

cookie = "";
result = await request("/api/admin/prompts");
assert(result.response.status === 403, "admin blocked for guest");

result = await request("/api/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accountStatus: "pro", role: "admin", email: "admin@example.com" }),
});
assert(result.body.role !== "admin", "normal session cannot mint admin");

result = await request("/api/session/admin-demo", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com" }),
});
assert(result.body.role === "admin", "admin session created");

result = await request("/api/admin/prompts");
assert(result.response.status === 200 && result.body.prompts?.length >= 100, "admin prompt list available");

result = await request("/api/admin/prompts/prompt_marketing_3/mark-tested", { method: "POST" });
assert(result.response.status === 200 && result.body.prompt?.isMuditaTested, "admin mark-tested works");
