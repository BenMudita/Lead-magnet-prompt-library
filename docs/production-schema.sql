-- Mudita Prompt Library production schema sketch for Postgres/Supabase.
-- Use RLS policies to enforce user/admin access in addition to server checks.

create type account_role as enum ('member', 'admin', 'editor', 'moderator', 'analyst');
create type subscription_status as enum ('free', 'active', 'past_due', 'cancelled');
create type prompt_access_level as enum ('free', 'pro');
create type prompt_status as enum ('draft', 'in_review', 'published', 'archived');
create type tag_status as enum ('suggested', 'approved', 'hidden', 'merged');
create type vote_value as enum ('helpful', 'not_helpful');
create type use_note_status as enum ('pending', 'approved', 'rejected');

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
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status tag_status not null default 'suggested',
  merged_into_tag_id uuid references tags(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null,
  plain_english_explanation text not null,
  category_id uuid not null references categories(id),
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
  prompt_id uuid not null references prompts(id) on delete cascade,
  tag_id uuid not null references tags(id),
  source text not null default 'human',
  approved_by_user_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (prompt_id, tag_id)
);

create table prompt_metrics (
  prompt_id uuid primary key references prompts(id) on delete cascade,
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
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  anonymous_id text,
  vote vote_value not null,
  created_at timestamptz not null default now(),
  constraint prompt_vote_identity check (user_id is not null or anonymous_id is not null)
);

create unique index prompt_votes_user_unique on prompt_votes(prompt_id, user_id) where user_id is not null;
create unique index prompt_votes_anon_unique on prompt_votes(prompt_id, anonymous_id) where anonymous_id is not null;

create table use_notes (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
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

create table favorite_prompts (
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references prompts(id) on delete cascade,
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
  prompt_id uuid references prompts(id) on delete cascade,
  job_type text not null,
  input jsonb not null,
  output jsonb,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

