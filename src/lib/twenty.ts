import { appEnv, hasTwentyApiConfig, hasTwentyWebhookConfig, isTwentyCrmEnabled } from "@/lib/env";

export type TwentySignupStatus = "magic_link_requested" | "confirmed";

export type TwentyLeadSyncInput = {
  email: string;
  status: TwentySignupStatus;
  source?: string;
  redirectTo?: string;
  signupUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  promptSlug?: string;
  userId?: string;
  existingContactId?: string;
};

export type TwentyLeadSyncResult = {
  provider: "twenty";
  contactId?: string;
  synced: boolean;
  error?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizeBaseUrl = (value: string) => {
  const withoutSlash = value.replace(/\/+$/, "");
  return withoutSlash.endsWith("/rest") ? withoutSlash : `${withoutSlash}/rest`;
};

const compact = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")) as T;

const localPartToName = (email: string) => {
  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!localPart) return "Prompt Library Lead";
  return localPart
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const addCustomField = (
  payload: Record<string, unknown>,
  fieldName: string | undefined,
  value: unknown,
) => {
  if (!fieldName || value === undefined || value === "") return;
  payload[fieldName] = value;
};

const buildTwentyPersonPayload = (input: TwentyLeadSyncInput) => {
  const email = normalizeEmail(input.email);
  const payload: Record<string, unknown> = {
    name: {
      firstName: localPartToName(email),
      lastName: "",
    },
    emails: {
      primaryEmail: email,
      additionalEmails: [],
    },
  };

  addCustomField(payload, appEnv.twentySignupStatusField, input.status);
  addCustomField(payload, appEnv.twentySignupUrlField, input.signupUrl);
  addCustomField(payload, appEnv.twentySignupSourceField, input.source);
  addCustomField(payload, appEnv.twentyReferrerField, input.referrer);
  addCustomField(payload, appEnv.twentyUtmSourceField, input.utmSource);
  addCustomField(payload, appEnv.twentyUtmMediumField, input.utmMedium);
  addCustomField(payload, appEnv.twentyUtmCampaignField, input.utmCampaign);
  addCustomField(payload, appEnv.twentyPromptSlugField, input.promptSlug);
  addCustomField(payload, appEnv.twentySupabaseUserIdField, input.userId);

  return payload;
};

const getResponseMessage = async (response: Response) => {
  const body = await response.text();
  if (!body) return `${response.status} ${response.statusText}`;

  try {
    const json = JSON.parse(body) as { message?: unknown; errors?: unknown };
    if (typeof json.message === "string") return json.message;
    if (json.errors) return JSON.stringify(json.errors);
  } catch {
    return body.slice(0, 300);
  }

  return body.slice(0, 300);
};

async function syncTwentyPerson(input: TwentyLeadSyncInput): Promise<TwentyLeadSyncResult> {
  if (!hasTwentyApiConfig()) {
    return { provider: "twenty", synced: false };
  }

  const baseUrl = normalizeBaseUrl(appEnv.twentyApiBaseUrl);
  const peoplePath = appEnv.twentyPeopleObject.replace(/^\/+|\/+$/g, "");
  const contactId = input.existingContactId;
  const url = contactId
    ? `${baseUrl}/${peoplePath}/${encodeURIComponent(contactId)}`
    : `${baseUrl}/${peoplePath}`;
  const method = contactId ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${appEnv.twentyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildTwentyPersonPayload(input)),
  });

  if (!response.ok) {
    return {
      provider: "twenty",
      contactId,
      synced: false,
      error: await getResponseMessage(response),
    };
  }

  const data = (await response.json().catch(() => ({}))) as { data?: { id?: string }; id?: string };
  return {
    provider: "twenty",
    contactId: data.data?.id ?? data.id ?? contactId,
    synced: true,
  };
}

async function sendTwentyWebhook(input: TwentyLeadSyncInput): Promise<TwentyLeadSyncResult> {
  if (!hasTwentyWebhookConfig()) {
    return { provider: "twenty", synced: false };
  }

  const response = await fetch(appEnv.twentyWebhookUrl as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: `prompt_library.signup.${input.status}`,
      data: compact({
        email: normalizeEmail(input.email),
        status: input.status,
        source: input.source,
        redirectTo: input.redirectTo,
        signupUrl: input.signupUrl,
        referrer: input.referrer,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        promptSlug: input.promptSlug,
        userId: input.userId,
      }),
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return {
      provider: "twenty",
      synced: false,
      error: await getResponseMessage(response),
    };
  }

  return { provider: "twenty", synced: true };
}

export async function syncTwentyLead(input: TwentyLeadSyncInput): Promise<TwentyLeadSyncResult> {
  if (!isTwentyCrmEnabled()) {
    return { provider: "twenty", synced: false };
  }

  if (hasTwentyApiConfig()) {
    return syncTwentyPerson(input);
  }

  return sendTwentyWebhook(input);
}
