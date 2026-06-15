# Mudita Prompt Library

A Next.js implementation of the Mudita Prompt Library PRD. The app is product-first rather than marketing-first: users land on `/promptlibrary`, choose an industry/function tile, browse curated prompt rows, open prompt details, copy/send prompts, vote, submit moderated use notes, and encounter signup/paywall gates where appropriate.

## What is included

- Product routes: `/promptlibrary`, category pages, global search, prompt detail, pricing, signup/login, account.
- Admin routes: prompt list/edit, QA review queue, use-note moderation, analytics.
- 108 seeded prompts across 9 categories, with 18 free samples and 27 Mudita-tested prompts.
- Server-side entitlement redaction for premium prompt bodies.
- Copy, send-to-ChatGPT, send-to-Claude fallback, share, vote, and use-note APIs.
- Demo auth/payment through secure cookies so the full flow is testable without keys.
- In-memory analytics/event capture for funnel and usage telemetry.
- Local AI tag/explanation stubs for admin workflow.

## Local setup

```bash
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000/promptlibrary](http://localhost:3000/promptlibrary).

Run checks:

```bash
npm run lint
npm run build
npm run smoke
```

`npm run smoke` expects the dev server to be running on `http://localhost:3000`.

## Demo sessions

- Guest: clear cookies or use a fresh browser.
- Free user: visit `/promptlibrary/signup` and submit the demo form.
- Pro user: visit `/promptlibrary/pricing` and click `Unlock Pro`. Demo checkout is disabled in production unless `ENABLE_DEMO_CHECKOUT=true`.
- Admin: visit `/admin/prompts` and use the admin demo form. The admin demo endpoint is disabled when `NODE_ENV=production`; production admin roles should come from the auth/database provider.

## Production provider keys needed

No keys are required for the local demo. For production, wire these before launch:

- Supabase or chosen auth/database: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FOUNDING_MEMBER_YEARLY`.
- Analytics: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`, or Segment equivalents.
- AI admin assistance: `OPENAI_API_KEY` or the chosen LLM provider key.
- Email: Resend/Postmark/provider API key for account/payment emails if auth/payment does not cover them.

See `docs/production-schema.sql` for a Postgres/Supabase-oriented data model.

## Production notes

The local app intentionally uses in-memory storage and cookie-based demo sessions so the entire PRD can be exercised without external dependencies. Before deployment, replace the demo store with the production database, replace demo checkout with Stripe Checkout/webhooks, and replace local AI stubs with provider-backed admin jobs.

The ChatGPT and Claude buttons use the PRD fallback: copy prompt, open the model site, and instruct the user to paste. I did not find an official stable web prompt-prefill contract in primary provider docs, so this avoids relying on brittle URL behavior. See `docs/send-to-model-spike.md`.
