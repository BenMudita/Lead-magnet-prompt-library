-- Add backend-editable lead magnet directory entries to an existing Supabase project.
-- Run this in Supabase SQL Editor, then run `npm run db:seed`.

do $$
begin
  create type lead_magnet_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.lead_magnet_entries (
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

create index if not exists lead_magnet_entries_published_order_idx
  on public.lead_magnet_entries (is_featured desc, is_trending desc, sort_order, updated_at desc)
  where status = 'published';

create index if not exists lead_magnet_entries_published_category_idx
  on public.lead_magnet_entries (lower(category), sort_order)
  where status = 'published';

create index if not exists lead_magnet_entries_tags_idx
  on public.lead_magnet_entries using gin (tags);

alter table public.lead_magnet_entries enable row level security;

drop policy if exists "Published lead magnet entries are public" on public.lead_magnet_entries;
create policy "Published lead magnet entries are public"
  on public.lead_magnet_entries for select
  to anon, authenticated
  using (status = 'published');

grant select on table public.lead_magnet_entries to anon, authenticated;
grant all on table public.lead_magnet_entries to service_role;

