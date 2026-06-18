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
  twentySyncEnabled: process.env.TWENTY_SYNC_ENABLED !== "false",
  twentyApiBaseUrl: process.env.TWENTY_API_BASE_URL ?? "https://api.twenty.com",
  twentyApiKey: process.env.TWENTY_API_KEY,
  twentyPeopleObject: process.env.TWENTY_PEOPLE_OBJECT ?? "people",
  twentyWebhookUrl: process.env.TWENTY_WEBHOOK_URL,
  twentySignupStatusField: process.env.TWENTY_FIELD_SIGNUP_STATUS,
  twentySignupUrlField: process.env.TWENTY_FIELD_SIGNUP_URL,
  twentySignupSourceField: process.env.TWENTY_FIELD_SIGNUP_SOURCE,
  twentyReferrerField: process.env.TWENTY_FIELD_REFERRER,
  twentyUtmSourceField: process.env.TWENTY_FIELD_UTM_SOURCE,
  twentyUtmMediumField: process.env.TWENTY_FIELD_UTM_MEDIUM,
  twentyUtmCampaignField: process.env.TWENTY_FIELD_UTM_CAMPAIGN,
  twentyPromptSlugField: process.env.TWENTY_FIELD_PROMPT_SLUG,
  twentySupabaseUserIdField: process.env.TWENTY_FIELD_SUPABASE_USER_ID,
};

export const hasSupabasePublicConfig = () =>
  Boolean(appEnv.supabaseUrl && appEnv.supabasePublicKey);

export const hasSupabaseAdminConfig = () =>
  Boolean(appEnv.supabaseUrl && appEnv.supabaseSecretKey);

export const hasStripeCheckoutConfig = () =>
  Boolean(appEnv.stripeSecretKey && appEnv.stripeFoundingMemberPriceId);

export const hasStripeWebhookConfig = () =>
  Boolean(appEnv.stripeSecretKey && appEnv.stripeWebhookSecret);

export const hasTwentyApiConfig = () =>
  Boolean(appEnv.twentySyncEnabled && appEnv.twentyApiKey);

export const hasTwentyWebhookConfig = () =>
  Boolean(appEnv.twentySyncEnabled && appEnv.twentyWebhookUrl);

export const isTwentyCrmEnabled = () =>
  hasTwentyApiConfig() || hasTwentyWebhookConfig();

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

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

const normalizeOrigin = (value?: string) => {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const isLocalOrigin = (origin?: string) => {
  if (!origin) return false;

  try {
    return LOCAL_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};

export const absoluteAppUrl = (requestUrl?: string) => {
  const configuredOrigin = normalizeOrigin(appEnv.appUrl);
  const requestOrigin = normalizeOrigin(requestUrl);

  if (
    configuredOrigin &&
    (!isLocalOrigin(configuredOrigin) || !requestOrigin || isLocalOrigin(requestOrigin))
  ) {
    return configuredOrigin;
  }

  return requestOrigin ?? configuredOrigin ?? "http://localhost:3000";
};
