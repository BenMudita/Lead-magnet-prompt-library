export type AuthProvider = "demo" | "supabase";
export type PaymentsProvider = "demo" | "stripe";
export type DatabaseProvider = "demo" | "supabase";

const asAuthProvider = (value?: string): AuthProvider =>
  value === "supabase" ? "supabase" : "demo";

const asPaymentsProvider = (value?: string): PaymentsProvider =>
  value === "stripe" ? "stripe" : "demo";

const asDatabaseProvider = (value?: string): DatabaseProvider =>
  value === "supabase" ? "supabase" : "demo";

export const appEnv = {
  authProvider: asAuthProvider(process.env.AUTH_PROVIDER),
  databaseProvider: asDatabaseProvider(process.env.DATABASE_PROVIDER),
  paymentsProvider: asPaymentsProvider(process.env.PAYMENTS_PROVIDER),
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublicKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeFoundingMemberPriceId: process.env.STRIPE_PRICE_FOUNDING_MEMBER_YEARLY,
  enableDemoCheckout: process.env.ENABLE_DEMO_CHECKOUT === "true",
};

export const hasSupabasePublicConfig = () =>
  Boolean(appEnv.supabaseUrl && appEnv.supabasePublicKey);

export const hasSupabaseAdminConfig = () =>
  Boolean(appEnv.supabaseUrl && appEnv.supabaseSecretKey);

export const hasStripeCheckoutConfig = () =>
  Boolean(appEnv.stripeSecretKey && appEnv.stripeFoundingMemberPriceId);

export const hasStripeWebhookConfig = () =>
  Boolean(appEnv.stripeSecretKey && appEnv.stripeWebhookSecret);

export const isSupabaseAuthEnabled = () =>
  appEnv.authProvider === "supabase" && hasSupabasePublicConfig();

export const isSupabaseDatabaseEnabled = () =>
  appEnv.databaseProvider === "supabase" && hasSupabaseAdminConfig();

export const isStripePaymentsEnabled = () =>
  appEnv.paymentsProvider === "stripe" && hasStripeCheckoutConfig();

export const getMissingProductionEnv = () => {
  const missing: string[] = [];

  if (appEnv.authProvider === "supabase" || appEnv.databaseProvider === "supabase") {
    if (!appEnv.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!appEnv.supabasePublicKey) {
      missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    if (!appEnv.supabaseSecretKey) {
      missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
    }
  }

  if (appEnv.paymentsProvider === "stripe") {
    if (!appEnv.stripeSecretKey) missing.push("STRIPE_SECRET_KEY");
    if (!appEnv.stripePublishableKey) missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    if (!appEnv.stripeWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
    if (!appEnv.stripeFoundingMemberPriceId) {
      missing.push("STRIPE_PRICE_FOUNDING_MEMBER_YEARLY");
    }
  }

  return missing;
};

export const absoluteAppUrl = (requestUrl?: string) => {
  if (appEnv.appUrl) return appEnv.appUrl.replace(/\/$/, "");
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
};
