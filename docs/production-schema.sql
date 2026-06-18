-- Mudita Prompt Library production schema sketch for Postgres/Supabase.
-- Use RLS policies to enforce user/admin access in addition to server checks.

create extension if not exists pgcrypto;

create type account_role as enum ('member', 'admin', 'editor', 'moderator', 'analyst');
create type subscription_status as enum ('free', 'active', 'past_due', 'cancelled');
create type prompt_access_level as enum ('free', 'pro');
create type prompt_status as enum ('draft', 'in_review', 'published', 'archived');
create type tag_status as enum ('suggested', 'approved', 'hidden', 'merged');
create type vote_value as enum ('helpful', 'not_helpful');
create type use_note_status as enum ('pending', 'approved', 'rejected');
create type lead_magnet_status as enum ('draft', 'published', 'archived');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role account_role not null default 'member',
  auth_provider text,
  subscription_status subscription_status not null default 'free',
  stripe_customer_id text,
  referral_code text unique,
  referred_by_user_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  status text not null default 'magic_link_requested',
  source text not null default 'prompt_library',
  redirect_to text,
  user_id uuid references profiles(id) on delete set null,
  request_count integer not null default 1 check (request_count >= 0),
  last_requested_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_signups_status_updated_idx
  on email_signups (status, updated_at desc);

create table plans (
  id text primary key,
  name text not null,
  price_cents integer not null,
  billing_interval text not null,
  is_active boolean not null default true,
  is_founding_member boolean not null default false,
  member_limit integer,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text not null,
  provider_subscription_id text unique,
  plan_id text references plans(id),
  status subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null,
  icon text not null default 'Sparkles',
  accent text not null default 'teal',
  primary_tags text[] not null default '{}',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tags (
  id text primary key,
  name text not null,
  slug text not null unique,
  status tag_status not null default 'suggested',
  merged_into_tag_id text references tags(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table prompts (
  id text primary key,
  title text not null,
  slug text not null unique,
  body text not null,
  plain_english_explanation text not null,
  category_id text not null references categories(id),
  access_level prompt_access_level not null default 'pro',
  status prompt_status not null default 'draft',
  editorial_quality_score integer not null default 70 check (editorial_quality_score between 0 and 100),
  is_featured boolean not null default false,
  is_mudita_tested boolean not null default false,
  tested_at timestamptz,
  tested_by_user_id uuid references profiles(id),
  tested_by_type text,
  testing_notes text,
  source_url text,
  source_notes text,
  created_by_user_id uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table prompt_tags (
  prompt_id text not null references prompts(id) on delete cascade,
  tag_id text not null references tags(id),
  source text not null default 'human',
  approved_by_user_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (prompt_id, tag_id)
);

create table prompt_metrics (
  prompt_id text primary key references prompts(id) on delete cascade,
  views_count integer not null default 0,
  detail_views_count integer not null default 0,
  copy_count integer not null default 0,
  send_chatgpt_count integer not null default 0,
  send_claude_count integer not null default 0,
  share_count integer not null default 0,
  helpful_count integer not null default 0,
  not_helpful_count integer not null default 0,
  last_used_at timestamptz,
  updated_at timestamptz not null default now()
);

create table prompt_votes (
  id text primary key,
  prompt_id text not null references prompts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  anonymous_id text,
  vote vote_value not null,
  created_at timestamptz not null default now(),
  constraint prompt_vote_identity check (user_id is not null or anonymous_id is not null)
);

create unique index prompt_votes_user_unique on prompt_votes(prompt_id, user_id) where user_id is not null;
create unique index prompt_votes_anon_unique on prompt_votes(prompt_id, anonymous_id) where anonymous_id is not null;

create table use_notes (
  id text primary key,
  prompt_id text not null references prompts(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  body text not null check (length(body) <= 280),
  status use_note_status not null default 'pending',
  is_public boolean not null default false,
  is_featured boolean not null default false,
  is_mudita_team_note boolean not null default false,
  moderated_by_user_id uuid references profiles(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create table lead_magnet_entries (
  id text primary key,
  title text not null,
  slug text not null unique,
  summary text not null check (length(summary) <= 240),
  description text not null,
  category text not null,
  audience text not null,
  outcome text not null,
  format text not null default 'Prompt',
  tags text[] not null default '{}',
  cta_label text not null default 'Open resource',
  cta_url text not null,
  proof_label text not null default 'New resource',
  copy_count integer not null default 0 check (copy_count >= 0),
  helpful_percent integer not null default 80 check (helpful_percent between 0 and 100),
  status lead_magnet_status not null default 'draft',
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_magnet_entries_published_order_idx
  on lead_magnet_entries (is_featured desc, is_trending desc, sort_order, updated_at desc)
  where status = 'published';

create index lead_magnet_entries_published_category_idx
  on lead_magnet_entries (lower(category), sort_order)
  where status = 'published';

create index lead_magnet_entries_tags_idx
  on lead_magnet_entries using gin (tags);

create table favorite_prompts (
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id text not null references prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  prompt_id text references prompts(id) on delete cascade,
  created_by_user_id uuid references profiles(id),
  referral_code text,
  destination_url text not null,
  click_count integer not null default 0,
  signup_count integer not null default 0,
  purchase_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references profiles(id) on delete set null,
  anonymous_id text not null,
  properties jsonb not null default '{}',
  url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create table ai_review_jobs (
  id uuid primary key default gen_random_uuid(),
  prompt_id text references prompts(id) on delete cascade,
  job_type text not null,
  input jsonb not null,
  output jsonb,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Supabase Auth profile bootstrap. The app also calls this defensively from
-- /auth/callback, but the trigger keeps direct auth signups consistent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_email text := coalesce(new.email, '');
  resolved_role account_role := case
    when lower(coalesce(new.email, '')) like '%@muditastudios.com' then 'admin'::account_role
    else 'member'::account_role
  end;
begin
  insert into public.profiles (id, email, name, role, auth_provider, subscription_status, created_at, last_login_at)
  values (
    new.id,
    resolved_email,
    new.raw_user_meta_data->>'name',
    resolved_role,
    coalesce(new.raw_app_meta_data->>'provider', 'supabase'),
    'free',
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row-level security defaults. Premium prompt body redaction happens in the
-- Next.js server API, so do not expose prompts directly to anonymous clients.
alter table profiles enable row level security;
alter table email_signups enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table prompts enable row level security;
alter table prompt_tags enable row level security;
alter table prompt_metrics enable row level security;
alter table prompt_votes enable row level security;
alter table use_notes enable row level security;
alter table lead_magnet_entries enable row level security;
alter table favorite_prompts enable row level security;
alter table share_links enable row level security;
alter table analytics_events enable row level security;
alter table ai_review_jobs enable row level security;
alter table subscriptions enable row level security;

create policy "Profiles can read themselves"
  on profiles for select
  using (auth.uid() = id);

create policy "Active categories are public"
  on categories for select
  using (is_active = true);

create policy "Approved tags are public"
  on tags for select
  using (status = 'approved');

create policy "Approved public use notes are public"
  on use_notes for select
  using (status = 'approved' and is_public = true);

create policy "Published lead magnet entries are public"
  on lead_magnet_entries for select
  to anon, authenticated
  using (status = 'published');

create policy "Members can create their own use notes"
  on use_notes for insert
  with check (auth.uid() = user_id);

create policy "Members can read their own votes"
  on prompt_votes for select
  using (auth.uid() = user_id);

create policy "Members can create their own votes"
  on prompt_votes for insert
  with check (auth.uid() = user_id);

create policy "Members can manage their favorites"
  on favorite_prompts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on table public.lead_magnet_entries to anon, authenticated;
grant all on table public.lead_magnet_entries to service_role;
grant all on table public.email_signups to service_role;
grant all on table public.categories to service_role;
grant all on table public.tags to service_role;
grant all on table public.prompts to service_role;
grant all on table public.prompt_tags to service_role;
grant all on table public.prompt_metrics to service_role;
grant all on table public.prompt_votes to service_role;
grant all on table public.use_notes to service_role;
