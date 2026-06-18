import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(name) {
  const filePath = path.join(root, name);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const authProvider = process.env.AUTH_PROVIDER || "demo";
const databaseProvider = process.env.DATABASE_PROVIDER || "demo";
const paymentsProvider = process.env.PAYMENTS_PROVIDER || "demo";

const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const isProductionRuntime = process.env.NETLIFY === "true" || process.env.NODE_ENV === "production";
const appUrlIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::|\/|$)/.test(
  process.env.NEXT_PUBLIC_APP_URL || "",
);

const checks = [
  ["NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL, "Recommended before auth emails or Stripe redirects go live."],
];

if (authProvider === "supabase" || databaseProvider === "supabase") {
  checks.push(
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL, "Required for Supabase."],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      supabasePublicKey,
      "Required for browser/server auth.",
    ],
    [
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
      supabaseSecretKey,
      "Required for server-side profile and webhook writes.",
    ],
  );
}

if (paymentsProvider === "stripe") {
  checks.push(
    ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY, "Required to create Checkout sessions."],
    [
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      "Required for future client-side Stripe surfaces.",
    ],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET, "Required for /api/stripe/webhook."],
    [
      "STRIPE_PRICE_FOUNDING_MEMBER_YEARLY",
      process.env.STRIPE_PRICE_FOUNDING_MEMBER_YEARLY,
      "Required Checkout price ID for the annual founding member plan.",
    ],
  );
}

const missing = checks.filter(([, value]) => !value);
const invalid = [];

if (isProductionRuntime && appUrlIsLocalhost) {
  invalid.push([
    "NEXT_PUBLIC_APP_URL",
    "Production auth emails cannot point at localhost. Use the deployed site URL.",
  ]);
}

console.log("Production provider selection");
console.log(`AUTH_PROVIDER=${authProvider}`);
console.log(`DATABASE_PROVIDER=${databaseProvider}`);
console.log(`PAYMENTS_PROVIDER=${paymentsProvider}`);
console.log(`TWENTY_SYNC=${process.env.TWENTY_SYNC_ENABLED === "false" ? "disabled" : process.env.TWENTY_API_KEY || process.env.TWENTY_WEBHOOK_URL ? "configured" : "not configured"}`);
console.log("");

if (!missing.length && !invalid.length) {
  console.log("PASS all required production env values are present.");
  process.exit(0);
}

if (missing.length) console.log("Missing values:");
for (const [name, , reason] of missing) {
  console.log(`- ${name}: ${reason}`);
}

if (invalid.length) {
  if (missing.length) console.log("");
  console.log("Invalid values:");
  for (const [name, reason] of invalid) {
    console.log(`- ${name}: ${reason}`);
  }
}

const hardMissing = missing.filter(([name]) => name !== "NEXT_PUBLIC_APP_URL");
process.exit(hardMissing.length || invalid.length ? 1 : 0);
