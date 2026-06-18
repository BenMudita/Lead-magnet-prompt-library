# Mudita Prompt Library

A Next.js implementation of the Mudita Prompt Library PRD. The app is product-first rather than marketing-first: users land on `/promptlibrary`, search or filter the full prompt grid, open prompt details, copy/send prompts, vote, submit moderated use notes, and enter an email when a locked prompt needs account access.

## What is included

- Product routes: `/promptlibrary`, category pages, global search, prompt detail, signup/login, account.
- Admin routes: prompt list/edit, lead magnet entry list/edit, QA review queue, use-note moderation, analytics.
- 108 seeded prompts across 9 categories, with 18 free samples and 27 Mudita-tested prompts.
- Supabase-backed prompt persistence for production prompt create/edit/import, prompt metrics, votes, and moderated use notes.
- Backend-editable lead magnet directory entries at `/promptlibrary/directory`.
- Server-side entitlement redaction for email-gated prompt bodies.
- Copy, send-to-ChatGPT, send-to-Claude fallback, share, vote, and use-note APIs.
- Demo auth through secure cookies so the full email-gated flow is testable without keys.
- In-memory analytics/event capture for funnel and usage telemetry.
- Local AI tag/explanation stubs for admin workflow.

## Local setup

```bash
npm install
npm run local
```

Open [http://localhost:3000/promptlibrary](http://localhost:3000/promptlibrary).

If port 3000 is already busy, run:

```bash
npm run dev -- --port 3001
```

Run checks:

```bash
npm run lint
npm run build
npm run smoke
```

`npm run smoke` expects the dev server to be running on `http://localhost:3000`. Use `SMOKE_BASE_URL=http://localhost:3001 npm run smoke` when testing another port.

## Demo sessions

- Guest: clear cookies or use a fresh browser.
- Email-unlocked user: visit `/promptlibrary/signup` and submit the demo form.
- Admin: visit `/admin/prompts` and use the admin demo form. The admin demo endpoint is disabled when `NODE_ENV=production`; production admin roles should come from the auth/database provider.

## Production provider keys needed

No keys are required for the local demo. For production, wire these before launch:

- Supabase or chosen auth/database: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL` set to the production site.
- Stripe/payment keys are not required for the current email-gated prompt library flow.
- Analytics: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`, or Segment equivalents.
- AI admin assistance: `OPENAI_API_KEY` or the chosen LLM provider key.
- Email: Resend/Postmark/provider API key for account/payment emails if auth/payment does not cover them.

See `docs/production-schema.sql` for a Postgres/Supabase-oriented data model.

## Production notes

The local app intentionally supports in-memory storage and cookie-based demo sessions so the prompt library can be exercised without external dependencies. In production, set `AUTH_PROVIDER=supabase` and `DATABASE_PROVIDER=supabase`, run `docs/production-schema.sql`, then run `npm run db:seed` to load the starter categories, tags, prompts, metrics, use notes, and lead magnet entries.

Supabase Auth must have the production domain set as its Site URL and must allow `/auth/callback`. Email-gated signups are saved into `public.email_signups` when a magic link is requested and marked confirmed after the callback completes.

Admins manage live prompts at `/admin/prompts`. Use **Create draft** for one prompt, **Import prompts** for CSV or JSON uploads, then edit, tag, test, and publish from the prompt editor. Import rows support fields such as `title`, `body`, `categorySlug` or `category`, `tags`, `status`, `accessLevel`, `summary`, `sourceUrl`, and `sourceNotes`.

The ChatGPT and Claude buttons use the PRD fallback: copy prompt, open the model site, and instruct the user to paste. I did not find an official stable web prompt-prefill contract in primary provider docs, so this avoids relying on brittle URL behavior. See `docs/send-to-model-spike.md`.

## Backend-editable directory entries

The public directory lives at `/promptlibrary/directory`. Admins manage entries at `/admin/entries`.

For Supabase-backed entries:

1. In Supabase SQL Editor, run `docs/lead-magnet-entries-schema.sql`. For a brand-new database, `docs/production-schema.sql` also includes this table.
2. Set `DATABASE_PROVIDER=supabase` plus `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` in Netlify/local env.
3. Run `npm run db:seed` to upload the starter entries.
4. Sign in with a `muditastudios.com` admin email, go to `/admin/entries`, then create, edit, publish, feature, or archive entries.

Each entry controls its public card: title, summary, description, category, audience, outcome, format, tags, CTA label/URL, proof copy, copy count, helpful percent, publish status, featured/trending flags, and sort order.
