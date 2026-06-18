# Production Setup

This app defaults to demo mode. Enable production services only when the matching account and keys are ready.

## 1. Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `docs/production-schema.sql`.
3. In Supabase Auth > URL Configuration:
   - Set Site URL to `https://YOUR_PRODUCTION_DOMAIN`.
   - Add `https://YOUR_PRODUCTION_DOMAIN/auth/callback` to Redirect URLs.
   - Add `https://YOUR_PRODUCTION_DOMAIN/auth/confirm` to Redirect URLs.
   - Add `http://localhost:3000/**` for local development.
   - Add `https://**--YOUR_NETLIFY_SITE_NAME.netlify.app/**` if Netlify deploy previews need auth.
4. Copy the project URL and keys into the deployment environment.

For new Supabase projects, prefer publishable and secret keys:

```bash
AUTH_PROVIDER=supabase
DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=https://YOUR_PRODUCTION_DOMAIN
```

Legacy Supabase `anon` and `service_role` keys are still supported by the app for older projects.

For the Magic Link email template, the default `{{ .ConfirmationURL }}` works with `/auth/callback`.
If you switch to a token-hash template, keep the app-provided redirect by using:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in</a>
```

This app also supports `/auth/confirm` for templates that route token hashes to a separate endpoint.

## 2. Stripe

1. Create the $49/year founding member recurring Price in Stripe.
2. Add a webhook endpoint:
   - Local testing: use the Stripe CLI to forward to `http://localhost:3000/api/stripe/webhook`
   - Production: `https://YOUR_PRODUCTION_DOMAIN/api/stripe/webhook`
3. Subscribe the webhook to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Add the Stripe values:

```bash
PAYMENTS_PROVIDER=stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_FOUNDING_MEMBER_YEARLY=
```

## 3. Verify

Run:

```bash
npm run env:check
npm run lint
npm run build
```

Local demo mode remains available with:

```bash
AUTH_PROVIDER=demo
DATABASE_PROVIDER=demo
PAYMENTS_PROVIDER=demo
ENABLE_DEMO_CHECKOUT=true
```

## 4. Twenty CRM lead sync

Supabase remains the access system. Twenty receives the CRM lead after a signup email is successfully requested, then receives a confirmed update after the user clicks the auth email.

1. In Twenty, open Settings > API & Webhooks and create a server API key.
2. Add these server-only values in Netlify:

```bash
TWENTY_API_BASE_URL=https://api.twenty.com
TWENTY_API_KEY=
TWENTY_PEOPLE_OBJECT=people
```

For self-hosted Twenty, use your app origin as `TWENTY_API_BASE_URL`; the app adds `/rest` automatically.

By default, the integration creates or updates a Person with the signup email. To write signup attribution into Person custom fields, create custom fields in Twenty and set their API names:

```bash
TWENTY_FIELD_SIGNUP_STATUS=
TWENTY_FIELD_SIGNUP_URL=
TWENTY_FIELD_SIGNUP_SOURCE=
TWENTY_FIELD_REFERRER=
TWENTY_FIELD_UTM_SOURCE=
TWENTY_FIELD_UTM_MEDIUM=
TWENTY_FIELD_UTM_CAMPAIGN=
TWENTY_FIELD_PROMPT_SLUG=
TWENTY_FIELD_SUPABASE_USER_ID=
```

As an alternative to direct API writes, set `TWENTY_WEBHOOK_URL` to a Twenty Workflow webhook URL. The app will post the full signup payload to that workflow.

Existing Supabase projects should add the CRM/attribution columns to `public.email_signups`:

```sql
alter table public.email_signups
  add column if not exists signup_url text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists prompt_slug text,
  add column if not exists crm_provider text,
  add column if not exists crm_contact_id text,
  add column if not exists crm_synced_at timestamptz,
  add column if not exists crm_sync_error text;
```

## 5. Prompt admin

After Supabase auth/database are enabled and the seed has run, sign in with a `muditastudios.com` admin email and open `/admin/prompts`. Admins can create single draft prompts or bulk import CSV/JSON prompt files; published imports appear in the public prompt library immediately.

Email-gated signups are captured in `public.email_signups` as soon as a magic link is requested, synced to CRM when configured, then marked `confirmed` after the user completes the Supabase callback.
